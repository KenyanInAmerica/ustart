/** @jest-environment node */

const mockGetUser = jest.fn();
const mockSignInWithOtp = jest.fn();
const mockFrom = jest.fn();
const mockServiceFrom = jest.fn();
const mockAdminDeleteUser = jest.fn();
const mockCreateUser = jest.fn();
const mockUpdateUserById = jest.fn();
const mockLogAction = jest.fn();

jest.mock("../../../lib/supabase/server", () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser, signInWithOtp: mockSignInWithOtp },
    from: mockFrom,
  })),
}));

// Service client: used for email validation (user_access), student name lookup
// (profiles), createUser / updateUserById (acceptInvitation), and deleteUser (unlinkParent).
jest.mock("../../../lib/supabase/service", () => ({
  createServiceClient: jest.fn(() => ({
    from: mockServiceFrom,
    auth: {
      admin: {
        deleteUser: mockAdminDeleteUser,
        createUser: mockCreateUser,
        updateUserById: mockUpdateUserById,
      },
    },
  })),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

jest.mock("../../../lib/audit/log", () => ({
  logAction: (...args: unknown[]) => mockLogAction(...args),
}));

// Resend client — jest.fn() must live inside the factory to avoid the hoisting
// TDZ error. Access the mock via the imported module reference after jest.mock().
jest.mock("../../../lib/resend/client", () => ({
  resend: { emails: { send: jest.fn() } },
}));

import { resend } from "../../../lib/resend/client";
import {
  sendParentInvitation,
  resendParentInvitation,
  cancelParentInvitation,
  unlinkParent,
  updateParentSharing,
  acceptInvitation,
} from "../../../lib/actions/parentInvitation";

// Typed alias — resend is already the mock object after jest.mock() above.
const mockResendEmailsSend = resend.emails.send as jest.Mock;

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
  chain.gt = fn;
  chain.maybeSingle = jest.fn().mockResolvedValue(returnValue);
  chain.single = jest.fn().mockResolvedValue(returnValue);
  return chain;
}

const AUTHENTICATED_USER = { id: "student-123" };

// Returns a chain that resolves maybeSingle() with `result` — used for service client reads.
// Includes gt() so it can be used for queries that filter on timestamptz columns.
function makeServiceReadChain(result: unknown) {
  const chain: Record<string, jest.Mock> = {} as Record<string, jest.Mock>;
  const linkFn = jest.fn(() => chain);
  chain.select = jest.fn(() => chain);
  chain.eq = linkFn;
  chain.gt = linkFn;
  chain.maybeSingle = jest.fn().mockResolvedValue(result);
  return chain;
}

describe("sendParentInvitation", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockFrom.mockReset();
    mockServiceFrom.mockReset();
    mockResendEmailsSend.mockReset();
    mockLogAction.mockReset();
    // Default: invited email doesn't belong to any existing account.
    mockServiceFrom.mockReturnValue(makeServiceReadChain({ data: null }));
    mockResendEmailsSend.mockResolvedValue({ error: null });
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
    // No existing invitation; insert succeeds.
    const noExisting = makeChain({ data: null, error: null });
    const insertChain = makeChain({ error: null });
    mockFrom
      .mockReturnValueOnce(noExisting)  // duplicate check
      .mockReturnValueOnce(insertChain); // insert
    // Service from: first = user_access email check (no existing), second = profiles for student name.
    mockServiceFrom
      .mockReturnValueOnce(makeServiceReadChain({ data: null }))
      .mockReturnValueOnce(makeServiceReadChain({ data: { first_name: "Alice", last_name: "Smith" } }));

    const result = await sendParentInvitation("parent@example.com");
    expect(result).toEqual({ success: true });
    expect(mockResendEmailsSend).toHaveBeenCalledTimes(1);
    expect(mockFrom).toHaveBeenNthCalledWith(
      2,
      "parent_invitations"
    );
    expect((mockFrom.mock.results[1]?.value as { insert: jest.Mock }).insert).toHaveBeenCalledWith(
      expect.objectContaining({
        share_tasks: true,
        share_calendar: true,
        share_content: true,
      })
    );
  });

  it("returns error when Resend fails to send the invitation email", async () => {
    mockGetUser.mockResolvedValue({ data: { user: AUTHENTICATED_USER } });
    const noExisting = makeChain({ data: null, error: null });
    mockFrom.mockReturnValueOnce(noExisting);
    mockServiceFrom
      .mockReturnValueOnce(makeServiceReadChain({ data: null }))
      .mockReturnValueOnce(makeServiceReadChain({ data: { first_name: "Alice", last_name: null } }));
    mockResendEmailsSend.mockResolvedValue({ error: { message: "Resend error" } });

    const result = await sendParentInvitation("parent@example.com");
    expect(result).toEqual({ success: false, error: "Failed to send invitation email." });
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
    mockFrom.mockReset();
    mockServiceFrom.mockReset();
    mockResendEmailsSend.mockReset();
    mockResendEmailsSend.mockResolvedValue({ error: null });
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

  it("returns success when invitation is resent with a fresh token", async () => {
    mockGetUser.mockResolvedValue({ data: { user: AUTHENTICATED_USER } });
    const invitationChain = makeChain({
      data: { id: "inv-1", parent_email: "parent@example.com" },
      error: null,
    });
    const updateChain = makeChain({ error: null });
    mockFrom
      .mockReturnValueOnce(invitationChain)
      .mockReturnValueOnce(updateChain);
    // Service from: profiles for student name lookup.
    mockServiceFrom.mockReturnValueOnce(
      makeServiceReadChain({ data: { first_name: "Alice", last_name: "Smith" } })
    );

    const result = await resendParentInvitation();
    expect(result).toEqual({ success: true });
    expect(mockResendEmailsSend).toHaveBeenCalledTimes(1);
  });

  it("returns error when Resend fails on resend", async () => {
    mockGetUser.mockResolvedValue({ data: { user: AUTHENTICATED_USER } });
    const invitationChain = makeChain({
      data: { id: "inv-1", parent_email: "parent@example.com" },
      error: null,
    });
    mockFrom.mockReturnValueOnce(invitationChain);
    mockServiceFrom.mockReturnValueOnce(
      makeServiceReadChain({ data: { first_name: "Alice", last_name: null } })
    );
    mockResendEmailsSend.mockResolvedValue({ error: { message: "Resend error" } });

    const result = await resendParentInvitation();
    expect(result).toEqual({ success: false, error: "Failed to send invitation email." });
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

describe("updateParentSharing", () => {
  const preferences = {
    share_tasks: false,
    share_calendar: true,
    share_content: false,
  };

  beforeEach(() => {
    mockGetUser.mockReset();
    mockFrom.mockReset();
    mockLogAction.mockReset();
  });

  it("returns error when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const result = await updateParentSharing(preferences);

    expect(result).toEqual({ success: false, error: "Not authenticated." });
  });

  it("returns error when no accepted invitation exists", async () => {
    mockGetUser.mockResolvedValue({ data: { user: AUTHENTICATED_USER } });
    mockFrom.mockReturnValueOnce(makeChain({ data: null, error: null }));

    const result = await updateParentSharing(preferences);

    expect(result).toEqual({
      success: false,
      error: "No accepted parent invitation found.",
    });
  });

  it("updates the accepted invitation sharing preferences", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { ...AUTHENTICATED_USER, email: "student@example.com" } },
    });
    const acceptedChain = makeChain({ data: { id: "inv-1" }, error: null });
    const updateChain = makeChain({ error: null });
    mockFrom.mockReturnValueOnce(acceptedChain).mockReturnValueOnce(updateChain);

    const result = await updateParentSharing(preferences);

    expect(result).toEqual({ success: true });
    expect((mockFrom.mock.results[1]?.value as { update: jest.Mock }).update).toHaveBeenCalledWith(
      preferences
    );
    expect(mockLogAction).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "parent.sharing_updated",
        payload: preferences,
      })
    );
  });
});

describe("acceptInvitation", () => {
  beforeEach(() => {
    // Reset all client mocks — mockFrom included to avoid stale call counts from
    // earlier describe blocks polluting the "not.toHaveBeenCalled" assertions below.
    mockFrom.mockReset();
    mockServiceFrom.mockReset();
    mockCreateUser.mockReset();
    mockUpdateUserById.mockReset();
    mockSignInWithOtp.mockReset();
    // Default happy path: createUser succeeds, signInWithOtp succeeds.
    mockCreateUser.mockResolvedValue({ data: { user: { id: "new-user-id" } }, error: null });
    mockSignInWithOtp.mockResolvedValue({ error: null });
  });

  it("returns error when token is not found or expired", async () => {
    mockServiceFrom.mockReturnValueOnce(makeServiceReadChain({ data: null }));

    const result = await acceptInvitation("invalid-token");
    expect(result).toEqual({
      success: false,
      error: "This invitation link has expired or is no longer valid.",
    });
    // createUser must not be called when token validation fails.
    expect(mockCreateUser).not.toHaveBeenCalled();
  });

  it("returns error when createUser fails with a non-exists error", async () => {
    mockServiceFrom.mockReturnValueOnce(
      makeServiceReadChain({
        data: { id: "inv-1", parent_email: "parent@example.com", student_id: "student-123" },
      })
    );
    mockCreateUser.mockResolvedValue({ data: null, error: { message: "Internal server error" } });

    const result = await acceptInvitation("valid-token");
    expect(result).toEqual({
      success: false,
      error: "Failed to set up your account. Please try again.",
    });
    expect(mockSignInWithOtp).not.toHaveBeenCalled();
  });

  it("returns { success: true } when user is created and magic link email is sent", async () => {
    mockServiceFrom.mockReturnValueOnce(
      makeServiceReadChain({
        data: { id: "inv-1", parent_email: "parent@example.com", student_id: "student-123" },
      })
    );
    // createUser and signInWithOtp are already set to success in beforeEach.

    const result = await acceptInvitation("valid-token");
    expect(result).toEqual({ success: true });
    expect(mockCreateUser).toHaveBeenCalledWith({
      email: "parent@example.com",
      email_confirm: true,
      user_metadata: { role: "parent", student_id: "student-123" },
    });
    expect(mockSignInWithOtp).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "parent@example.com",
        options: expect.objectContaining({ shouldCreateUser: false }),
      })
    );
  });

  it("handles already-existing user — updates metadata and sends magic link", async () => {
    // First call: invitation lookup; second call: user_access email lookup.
    mockServiceFrom
      .mockReturnValueOnce(
        makeServiceReadChain({
          data: { id: "inv-1", parent_email: "parent@example.com", student_id: "student-123" },
        })
      )
      .mockReturnValueOnce(
        makeServiceReadChain({ data: { id: "existing-user-id" } })
      );
    mockCreateUser.mockResolvedValue({
      data: null,
      error: { message: "User already registered" },
    });
    mockUpdateUserById.mockResolvedValue({ data: null, error: null });

    const result = await acceptInvitation("valid-token");
    expect(result).toEqual({ success: true });
    expect(mockUpdateUserById).toHaveBeenCalledWith("existing-user-id", {
      user_metadata: { role: "parent", student_id: "student-123" },
    });
    expect(mockSignInWithOtp).toHaveBeenCalledTimes(1);
  });

  it("returns error when signInWithOtp fails", async () => {
    mockServiceFrom.mockReturnValueOnce(
      makeServiceReadChain({
        data: { id: "inv-1", parent_email: "parent@example.com", student_id: "student-123" },
      })
    );
    mockSignInWithOtp.mockResolvedValue({ error: { message: "OTP rate limit exceeded" } });

    const result = await acceptInvitation("valid-token");
    expect(result).toEqual({
      success: false,
      error: "Failed to send sign-in email. Please try again.",
    });
  });

  it("does not update the invitation row (auth callback handles that)", async () => {
    mockServiceFrom.mockReturnValueOnce(
      makeServiceReadChain({
        data: { id: "inv-1", parent_email: "parent@example.com", student_id: "student-123" },
      })
    );

    await acceptInvitation("valid-token");

    // mockFrom is the regular (non-service) Supabase client — must not be called
    // because acceptInvitation never writes to parent_invitations directly.
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
