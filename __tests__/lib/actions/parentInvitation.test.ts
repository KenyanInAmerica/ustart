/** @jest-environment node */

const mockGetUser = jest.fn();
const mockSignInWithOtp = jest.fn();
const mockFrom = jest.fn();
const mockServiceFrom = jest.fn();
const mockAdminDeleteUser = jest.fn();

jest.mock("../../../lib/supabase/server", () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: mockGetUser,
      signInWithOtp: mockSignInWithOtp,
    },
    from: mockFrom,
  })),
}));

// Service client is used in sendParentInvitation (email validation) and
// unlinkParent (auth.admin.deleteUser to fully remove the parent account).
jest.mock("../../../lib/supabase/service", () => ({
  createServiceClient: jest.fn(() => ({
    from: mockServiceFrom,
    auth: {
      admin: {
        deleteUser: mockAdminDeleteUser,
      },
    },
  })),
}));

jest.mock("next/headers", () => ({
  headers: jest.fn(() => ({
    get: (key: string) => (key === "host" ? "localhost:3000" : null),
  })),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

import {
  sendParentInvitation,
  resendParentInvitation,
  cancelParentInvitation,
  unlinkParent,
} from "../../../lib/actions/parentInvitation";

// Builds a chainable, thenable Supabase query stub.
// Thenable so you can `await` the chain directly (insert/update without maybeSingle),
// and also call further chain methods for select queries.
function makeChain(returnValue: unknown): Record<string, unknown> {
  const p = Promise.resolve(returnValue);
  const chain: Record<string, unknown> = {
    then: p.then.bind(p),
    catch: p.catch.bind(p),
  };
  const fn: jest.Mock = jest.fn(() => chain);
  chain.select = fn;
  chain.insert = fn;
  chain.update = fn;
  chain.eq = fn;
  chain.in = fn;
  chain.maybeSingle = jest.fn().mockResolvedValue(returnValue);
  chain.single = jest.fn().mockResolvedValue(returnValue);
  return chain;
}

const AUTHENTICATED_USER = { id: "student-123" };

// Returns a chain that resolves maybeSingle() with `result` — used for service client reads.
function makeServiceReadChain(result: unknown) {
  const chain: Record<string, jest.Mock> = {} as Record<string, jest.Mock>;
  const eqFn = jest.fn(() => chain);
  chain.select = jest.fn(() => chain);
  chain.eq = eqFn;
  chain.maybeSingle = jest.fn().mockResolvedValue(result);
  return chain;
}

describe("sendParentInvitation", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockSignInWithOtp.mockReset();
    mockFrom.mockReset();
    mockServiceFrom.mockReset();
    // Default: invited email doesn't belong to any existing account.
    mockServiceFrom.mockReturnValue(makeServiceReadChain({ data: null }));
  });

  it("returns error when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const result = await sendParentInvitation("parent@example.com");
    expect(result).toEqual({ success: false, error: "Not authenticated." });
  });

  it("returns error for invalid email format", async () => {
    mockGetUser.mockResolvedValue({ data: { user: AUTHENTICATED_USER } });
    const result = await sendParentInvitation("not-an-email");
    expect(result).toEqual({ success: false, error: "Please enter a valid email address." });
  });

  it("returns error when an active invitation already exists", async () => {
    mockGetUser.mockResolvedValue({ data: { user: AUTHENTICATED_USER } });
    // The duplicate check returns an existing row
    mockFrom.mockReturnValue(makeChain({ data: { id: "existing-id" }, error: null }));
    const result = await sendParentInvitation("parent@example.com");
    expect(result).toEqual({ success: false, error: "An active invitation already exists." });
  });

  it("returns success when invitation is sent", async () => {
    mockGetUser.mockResolvedValue({ data: { user: AUTHENTICATED_USER } });
    // No existing invitation
    const noExisting = makeChain({ data: null, error: null });
    // Insert succeeds
    const insertChain = makeChain({ error: null });
    mockFrom
      .mockReturnValueOnce(noExisting) // duplicate check
      .mockReturnValueOnce(insertChain); // insert
    mockSignInWithOtp.mockResolvedValue({ error: null });

    const result = await sendParentInvitation("parent@example.com");
    expect(result).toEqual({ success: true });
  });

  it("returns error when invited email belongs to an existing student account", async () => {
    mockGetUser.mockResolvedValue({ data: { user: AUTHENTICATED_USER } });
    // user_access lookup finds a row → account exists
    mockServiceFrom
      .mockReturnValueOnce(makeServiceReadChain({ data: { id: "existing-user-id" } }))
      // profiles lookup → role is student
      .mockReturnValueOnce(makeServiceReadChain({ data: { role: "student", student_id: null } }));

    const result = await sendParentInvitation("student@example.com");
    expect(result).toEqual({
      success: false,
      error: "This email belongs to an existing student account and cannot be invited as a parent.",
    });
  });

  it("returns error when invited email belongs to a parent linked to another student", async () => {
    mockGetUser.mockResolvedValue({ data: { user: AUTHENTICATED_USER } });
    // user_access lookup finds a row → account exists
    mockServiceFrom
      .mockReturnValueOnce(makeServiceReadChain({ data: { id: "other-parent-id" } }))
      // profiles lookup → role is parent, linked to a different student
      .mockReturnValueOnce(
        makeServiceReadChain({ data: { role: "parent", student_id: "other-student-id" } })
      );

    const result = await sendParentInvitation("taken-parent@example.com");
    expect(result).toEqual({
      success: false,
      error: "This parent account is already linked to another student.",
    });
  });
});

describe("resendParentInvitation", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockSignInWithOtp.mockReset();
    mockFrom.mockReset();
  });

  it("returns error when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const result = await resendParentInvitation();
    expect(result).toEqual({ success: false, error: "Not authenticated." });
  });

  it("returns error when no pending invitation found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: AUTHENTICATED_USER } });
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }));
    const result = await resendParentInvitation();
    expect(result).toEqual({ success: false, error: "No pending invitation found." });
  });

  it("returns success when OTP is resent", async () => {
    mockGetUser.mockResolvedValue({ data: { user: AUTHENTICATED_USER } });
    const invitationChain = makeChain({
      data: { id: "inv-1", parent_email: "parent@example.com" },
      error: null,
    });
    const updateChain = makeChain({ error: null });
    mockFrom
      .mockReturnValueOnce(invitationChain)
      .mockReturnValueOnce(updateChain);
    mockSignInWithOtp.mockResolvedValue({ error: null });

    const result = await resendParentInvitation();
    expect(result).toEqual({ success: true });
  });
});

describe("cancelParentInvitation", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockFrom.mockReset();
  });

  it("returns error when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const result = await cancelParentInvitation();
    expect(result).toEqual({ success: false, error: "Not authenticated." });
  });

  it("returns success when invitation is cancelled", async () => {
    mockGetUser.mockResolvedValue({ data: { user: AUTHENTICATED_USER } });
    mockFrom.mockReturnValue(makeChain({ error: null }));
    const result = await cancelParentInvitation();
    expect(result).toEqual({ success: true });
  });
});

describe("unlinkParent", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockFrom.mockReset();
    mockServiceFrom.mockReset();
    mockAdminDeleteUser.mockReset();
  });

  it("returns error when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const result = await unlinkParent();
    expect(result).toEqual({ success: false, error: "Not authenticated." });
  });

  it("returns success even when no parent profile found (still cancels invitation)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: AUTHENTICATED_USER } });
    // profiles query uses the service client — no row found, skip deletion.
    mockServiceFrom.mockReturnValueOnce(makeServiceReadChain({ data: null }));
    const invitationUpdateChain = makeChain({ error: null });
    mockFrom.mockReturnValueOnce(invitationUpdateChain);

    const result = await unlinkParent();
    expect(result).toEqual({ success: true });
    expect(mockAdminDeleteUser).not.toHaveBeenCalled();
  });

  it("returns success when parent account is deleted and invitation is cancelled", async () => {
    mockGetUser.mockResolvedValue({ data: { user: AUTHENTICATED_USER } });
    // profiles query via service client returns the parent's ID.
    mockServiceFrom.mockReturnValueOnce(
      makeServiceReadChain({ data: { id: "parent-profile-id" } })
    );
    mockAdminDeleteUser.mockResolvedValue({ error: null });
    const invitationUpdateChain = makeChain({ error: null });
    mockFrom.mockReturnValueOnce(invitationUpdateChain);

    const result = await unlinkParent();
    expect(result).toEqual({ success: true });
    expect(mockAdminDeleteUser).toHaveBeenCalledWith("parent-profile-id");
  });

  it("returns error when parent account deletion fails", async () => {
    mockGetUser.mockResolvedValue({ data: { user: AUTHENTICATED_USER } });
    mockServiceFrom.mockReturnValueOnce(
      makeServiceReadChain({ data: { id: "parent-profile-id" } })
    );
    mockAdminDeleteUser.mockResolvedValue({ error: { message: "Auth error" } });

    const result = await unlinkParent();
    expect(result).toEqual({ success: false, error: "Failed to remove parent account." });
  });

  it("returns error when invitation update fails", async () => {
    mockGetUser.mockResolvedValue({ data: { user: AUTHENTICATED_USER } });
    // No parent profile — skip deletion, go straight to invitation cancel.
    mockServiceFrom.mockReturnValueOnce(makeServiceReadChain({ data: null }));
    const invitationUpdateChain = makeChain({ error: { message: "DB error" } });
    mockFrom.mockReturnValueOnce(invitationUpdateChain);

    const result = await unlinkParent();
    expect(result).toEqual({ success: false, error: "Failed to update invitation status." });
  });
});
