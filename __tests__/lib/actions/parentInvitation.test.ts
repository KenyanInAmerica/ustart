/** @jest-environment node */

const mockGetUser = jest.fn();
const mockSignInWithOtp = jest.fn();
const mockFrom = jest.fn();

jest.mock("../../../lib/supabase/server", () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: mockGetUser,
      signInWithOtp: mockSignInWithOtp,
    },
    from: mockFrom,
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

describe("sendParentInvitation", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockSignInWithOtp.mockReset();
    mockFrom.mockReset();
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
  });

  it("returns error when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const result = await unlinkParent();
    expect(result).toEqual({ success: false, error: "Not authenticated." });
  });

  it("returns success even when no parent profile found (still cancels invitation)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: AUTHENTICATED_USER } });
    // profiles.maybeSingle() returns no row; parent_invitations update succeeds.
    const profileFindChain = makeChain({ data: null, error: null });
    const invitationUpdateChain = makeChain({ error: null });
    mockFrom
      .mockReturnValueOnce(profileFindChain)
      .mockReturnValueOnce(invitationUpdateChain);

    const result = await unlinkParent();
    expect(result).toEqual({ success: true });
  });

  it("returns success when parent is unlinked", async () => {
    mockGetUser.mockResolvedValue({ data: { user: AUTHENTICATED_USER } });
    const profileFindChain = makeChain({ data: { id: "parent-profile-id" }, error: null });
    const profileUpdateChain = makeChain({ error: null });
    const invitationUpdateChain = makeChain({ error: null });
    mockFrom
      .mockReturnValueOnce(profileFindChain)
      .mockReturnValueOnce(profileUpdateChain)
      .mockReturnValueOnce(invitationUpdateChain);

    const result = await unlinkParent();
    expect(result).toEqual({ success: true });
  });

  it("returns error when invitation update fails", async () => {
    mockGetUser.mockResolvedValue({ data: { user: AUTHENTICATED_USER } });
    const profileFindChain = makeChain({ data: null, error: null });
    const invitationUpdateChain = makeChain({ error: { message: "DB error" } });
    mockFrom
      .mockReturnValueOnce(profileFindChain)
      .mockReturnValueOnce(invitationUpdateChain);

    const result = await unlinkParent();
    expect(result).toEqual({ success: false, error: "Failed to update invitation status." });
  });
});
