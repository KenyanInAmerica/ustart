/** @jest-environment node */

const mockGetUser = jest.fn();
const mockServiceFrom = jest.fn();
const mockListUsers = jest.fn();
const mockCreateUser = jest.fn();
const mockDeleteUser = jest.fn();

jest.mock("../../../../lib/supabase/server", () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
}));

jest.mock("../../../../lib/supabase/service", () => ({
  createServiceClient: jest.fn(() => ({
    from: mockServiceFrom,
    auth: {
      admin: {
        listUsers: mockListUsers,
        createUser: mockCreateUser,
        deleteUser: mockDeleteUser,
      },
    },
  })),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

jest.mock("../../../../lib/resend/client", () => ({
  resend: { emails: { send: jest.fn() } },
}));

import { resend } from "../../../../lib/resend/client";
import { adminLinkParent } from "../../../../lib/actions/admin/invitations";

const mockResendSend = resend.emails.send as jest.Mock;

// Chainable Supabase query stub — supports awaited writes and chained selects.
// Includes .in() so the cancel step (.eq(...).in("status",[...])) doesn't throw.
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
  return chain;
}

const ADMIN_USER = { id: "admin-1" };
const VALID_STUDENT = {
  id: "student-1",
  role: "student",
  is_admin: false,
  first_name: "Alice",
  last_name: "Smith",
};

describe("adminLinkParent", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockServiceFrom.mockReset();
    mockListUsers.mockReset();
    mockCreateUser.mockReset();
    mockDeleteUser.mockReset();
    mockResendSend.mockReset();

    process.env.NEXT_PUBLIC_SITE_URL = "https://example.com";

    // Default: admin check passes
    mockGetUser.mockResolvedValue({ data: { user: ADMIN_USER } });
    // Default: Resend succeeds
    mockResendSend.mockResolvedValue({ error: null });
  });

  it("returns error when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const result = await adminLinkParent("student@example.com", "parent@example.com");
    expect(result).toEqual({ success: false, error: "Not authenticated." });
  });

  it("returns error when caller is not admin", async () => {
    // Admin check: profiles query returns is_admin = false
    mockServiceFrom.mockReturnValueOnce(makeChain({ data: { is_admin: false } }));
    const result = await adminLinkParent("student@example.com", "parent@example.com");
    expect(result).toEqual({ success: false, error: "Forbidden." });
  });

  it("returns error for invalid email format", async () => {
    mockServiceFrom.mockReturnValueOnce(makeChain({ data: { is_admin: true } }));
    const result = await adminLinkParent("not-an-email", "parent@example.com");
    expect(result).toEqual({ success: false, error: "Please enter valid email addresses." });
  });

  it("returns error when student and parent email are the same", async () => {
    mockServiceFrom.mockReturnValueOnce(makeChain({ data: { is_admin: true } }));
    const result = await adminLinkParent("same@example.com", "same@example.com");
    expect(result).toEqual({
      success: false,
      error: "Student and parent emails must be different.",
    });
  });

  it("returns error when student account does not exist", async () => {
    // Admin check passes, then student lookup returns null
    mockServiceFrom
      .mockReturnValueOnce(makeChain({ data: { is_admin: true } }))
      .mockReturnValueOnce(makeChain({ data: null }));
    const result = await adminLinkParent("nobody@example.com", "parent@example.com");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/does not match/i);
  });

  it("returns error when student already has an accepted invitation", async () => {
    mockServiceFrom
      .mockReturnValueOnce(makeChain({ data: { is_admin: true } }))   // admin check
      .mockReturnValueOnce(makeChain({ data: VALID_STUDENT }))          // student lookup
      .mockReturnValueOnce(makeChain({ data: { id: "inv-1" } }));       // existing accepted invitation
    mockListUsers.mockResolvedValue({ data: { users: [] } });
    const result = await adminLinkParent("student@example.com", "parent@example.com");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/already has a linked parent/i);
  });

  it("returns error when parent email already exists", async () => {
    mockServiceFrom
      .mockReturnValueOnce(makeChain({ data: { is_admin: true } }))   // admin check
      .mockReturnValueOnce(makeChain({ data: VALID_STUDENT }))          // student lookup
      .mockReturnValueOnce(makeChain({ data: null }));                   // no existing invitation
    mockListUsers.mockResolvedValue({
      data: { users: [{ email: "parent@example.com" }] },
    });
    const result = await adminLinkParent("student@example.com", "parent@example.com");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/already belongs to an existing account/i);
  });

  it("returns error when Resend fails and cleans up created account and invitation row", async () => {
    mockServiceFrom
      .mockReturnValueOnce(makeChain({ data: { is_admin: true } }))   // admin check
      .mockReturnValueOnce(makeChain({ data: VALID_STUDENT }))          // student lookup
      .mockReturnValueOnce(makeChain({ data: null }))                   // no existing accepted invitation
      .mockReturnValueOnce(makeChain({ error: null }))                  // 4b: cancel existing
      .mockReturnValueOnce(makeChain({ error: null }))                  // 4c: insert pending
      .mockReturnValueOnce(makeChain({ error: null }));                 // rollback: cancel pending
    mockListUsers.mockResolvedValue({ data: { users: [] } });
    mockCreateUser.mockResolvedValue({ data: { user: { id: "new-parent-id" } }, error: null });
    mockDeleteUser.mockResolvedValue({ error: null });
    mockResendSend.mockResolvedValue({ error: { message: "Resend error" } });

    const result = await adminLinkParent("student@example.com", "parent@example.com");
    expect(result).toEqual({ success: false, error: "Failed to send invitation email to parent." });
    // Both the auth account and the invitation row must be rolled back
    expect(mockDeleteUser).toHaveBeenCalledWith("new-parent-id");
  });

  it("returns success and sends invitation email with /invite URL on valid inputs", async () => {
    mockServiceFrom
      .mockReturnValueOnce(makeChain({ data: { is_admin: true } }))   // admin check
      .mockReturnValueOnce(makeChain({ data: VALID_STUDENT }))          // student lookup
      .mockReturnValueOnce(makeChain({ data: null }))                   // no existing accepted invitation
      .mockReturnValueOnce(makeChain({ error: null }))                  // 4b: cancel existing
      .mockReturnValueOnce(makeChain({ error: null }));                 // 4c: insert pending
    mockListUsers.mockResolvedValue({ data: { users: [] } });
    mockCreateUser.mockResolvedValue({ data: { user: { id: "new-parent-id" } }, error: null });

    const result = await adminLinkParent("student@example.com", "parent@example.com");
    expect(result).toEqual({ success: true });

    // createUser must be called with user_metadata for callback profile linking
    expect(mockCreateUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "parent@example.com",
        email_confirm: true,
        user_metadata: expect.objectContaining({ role: "parent", student_id: "student-1" }),
      })
    );

    expect((mockServiceFrom.mock.results[4]?.value as { insert: jest.Mock }).insert).toHaveBeenCalledWith(
      expect.objectContaining({
        share_tasks: true,
        share_calendar: true,
        share_content: true,
      })
    );

    // Email must point to the /invite confirmation page, not a raw magic link
    expect(mockResendSend).toHaveBeenCalledTimes(1);
    expect(mockResendSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "parent@example.com",
        subject: "You've been invited to UStart",
        html: expect.stringContaining("/invite?token="),
      })
    );
  });
});
