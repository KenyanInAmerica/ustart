/** @jest-environment node */

// ── Shared mock setup ─────────────────────────────────────────────────────────

const mockMaybeSingle = jest.fn();
const mockUpdate = jest.fn();
const mockDeleteAuth = jest.fn();
const mockGetUser = jest.fn();
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
const mockRevalidatePath = jest.fn(); // unused but kept for future assertions

jest.mock("../../../../lib/audit/log", () => ({ logAction: jest.fn() }));

const mockTrackHubSpotContact = jest.fn();
jest.mock("../../../../lib/hubspot/contacts", () => ({
  trackHubSpotContact: (...args: unknown[]) => mockTrackHubSpotContact(...args),
}));
jest.mock("../../../../lib/hubspot/client", () => ({
  getHubSpotEnvironment: jest.fn(() => "staging"),
}));

// lib/admin/data uses React.cache which is unavailable in the Node test environment.
jest.mock("../../../../lib/admin/data", () => ({
  fetchAdminUsers: jest.fn(),
  fetchUserAssignments: jest.fn(),
}));

jest.mock("../../../../lib/supabase/server", () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
}));

// Service client — needs to handle profile select + mutations.
let mockFromImpl: jest.Mock;
jest.mock("../../../../lib/supabase/service", () => ({
  createServiceClient: jest.fn(() => ({
    from: (...args: unknown[]) => mockFromImpl(...args),
    auth: {
      admin: { deleteUser: mockDeleteAuth },
    },
  })),
}));

import {
  softDeleteUser,
  hardDeleteUser,
  reactivateUser,
  setUserMembershipTier,
} from "../../../../lib/actions/admin/users";

const flush = () => new Promise<void>((r) => setTimeout(r, 0));

// Helper: make requireAdmin() succeed (caller is an admin).
function mockAdmin() {
  mockGetUser.mockResolvedValue({
    data: { user: { id: "admin-1", email: "admin@test.com" } },
  });
  // requireAdmin does: profiles.select("is_admin").eq().maybeSingle()
  // softDeleteUser also does a second profiles query — both return is_admin: true
  // for the caller but is_admin: false for the target unless overridden.
}

beforeEach(() => {
  jest.clearAllMocks();
  mockAdmin();
  mockFromImpl = jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({ maybeSingle: mockMaybeSingle })),
      in: jest.fn(() => ({})),
    })),
    // update().eq() must be both awaitable (single eq, e.g. profiles update) and
    // chainable with a second .eq() (parent_invitations cancel uses .eq().eq()).
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        eq: jest.fn(() => mockUpdate()),
        then: (
          onfulfilled: Parameters<Promise<unknown>["then"]>[0],
          onrejected?: Parameters<Promise<unknown>["then"]>[1]
        ) => mockUpdate().then(onfulfilled, onrejected),
        catch: (onrejected: Parameters<Promise<unknown>["catch"]>[0]) =>
          mockUpdate().catch(onrejected),
      })),
    })),
    upsert: jest.fn(),
    delete: jest.fn(() => ({ eq: jest.fn(() => ({ eq: jest.fn(() => ({})) })) })),
    insert: jest.fn(),
  }));
});

// ── softDeleteUser ────────────────────────────────────────────────────────────

describe("softDeleteUser", () => {
  it("returns error when caller is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const result = await softDeleteUser("u1");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/not authenticated/i);
  });

  it("returns error when target user is an admin", async () => {
    // First maybeSingle: caller admin check (is_admin: true)
    // Second maybeSingle: target user check (is_admin: true)
    mockMaybeSingle
      .mockResolvedValueOnce({ data: { is_admin: true } }) // caller
      .mockResolvedValueOnce({ data: { is_admin: true } }); // target

    const result = await softDeleteUser("admin-target");
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error).toMatch(/admin accounts cannot be deleted/i);
  });

  it("returns success when target is not an admin", async () => {
    mockMaybeSingle
      .mockResolvedValueOnce({ data: { is_admin: true } }) // caller ok
      .mockResolvedValueOnce({ data: { is_admin: false } }); // target ok
    mockUpdate.mockResolvedValue({ error: null });

    const result = await softDeleteUser("u1");
    expect(result.success).toBe(true);
  });

  it("returns error when DB update fails", async () => {
    mockMaybeSingle
      .mockResolvedValueOnce({ data: { is_admin: true } })
      .mockResolvedValueOnce({ data: { is_admin: false } });
    mockUpdate.mockResolvedValue({ error: { message: "DB error" } });

    const result = await softDeleteUser("u1");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("DB error");
  });

  it("cancels pending parent invitations after deactivating the profile", async () => {
    mockMaybeSingle
      .mockResolvedValueOnce({ data: { is_admin: true } })
      .mockResolvedValueOnce({ data: { is_admin: false } });
    mockUpdate.mockResolvedValue({ error: null });

    await softDeleteUser("u1");

    // Verify parent_invitations was queried as part of the soft delete.
    const calledTables = (mockFromImpl.mock.calls as [string][]).map((c) => c[0]);
    expect(calledTables).toContain("parent_invitations");
  });
});

// ── hardDeleteUser ────────────────────────────────────────────────────────────

describe("hardDeleteUser", () => {
  it("returns error when caller is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const result = await hardDeleteUser("u1");
    expect(result.success).toBe(false);
  });

  it("returns error when target user is an admin", async () => {
    mockMaybeSingle
      .mockResolvedValueOnce({ data: { is_admin: true } })
      .mockResolvedValueOnce({ data: { is_admin: true } });

    const result = await hardDeleteUser("admin-target");
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error).toMatch(/admin accounts cannot be deleted/i);
  });

  it("calls auth.admin.deleteUser with the target ID", async () => {
    mockMaybeSingle
      .mockResolvedValueOnce({ data: { is_admin: true } })
      .mockResolvedValueOnce({ data: { is_admin: false } });
    mockDeleteAuth.mockResolvedValue({ error: null });

    await hardDeleteUser("u1");
    expect(mockDeleteAuth).toHaveBeenCalledWith("u1");
  });

  it("returns success when deleteUser succeeds", async () => {
    mockMaybeSingle
      .mockResolvedValueOnce({ data: { is_admin: true } })
      .mockResolvedValueOnce({ data: { is_admin: false } });
    mockDeleteAuth.mockResolvedValue({ error: null });

    const result = await hardDeleteUser("u1");
    expect(result.success).toBe(true);
  });

  it("returns error when deleteUser fails", async () => {
    mockMaybeSingle
      .mockResolvedValueOnce({ data: { is_admin: true } })
      .mockResolvedValueOnce({ data: { is_admin: false } });
    mockDeleteAuth.mockResolvedValue({ error: { message: "Auth error" } });

    const result = await hardDeleteUser("u1");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Auth error");
  });
});

// ── reactivateUser ────────────────────────────────────────────────────────────

describe("reactivateUser", () => {
  it("returns error when caller is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const result = await reactivateUser("u1");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/not authenticated/i);
  });

  it("returns success when update succeeds", async () => {
    // requireAdmin: is_admin check for the caller.
    // Second maybeSingle: email lookup on the target profile.
    mockMaybeSingle
      .mockResolvedValueOnce({ data: { is_admin: true } })
      .mockResolvedValueOnce({ data: { email: null } });
    mockUpdate.mockResolvedValue({ error: null });

    const result = await reactivateUser("u1");
    expect(result.success).toBe(true);
  });

  it("returns error when DB update fails", async () => {
    mockMaybeSingle
      .mockResolvedValueOnce({ data: { is_admin: true } })
      .mockResolvedValueOnce({ data: { email: null } });
    mockUpdate.mockResolvedValue({ error: { message: "DB error" } });

    const result = await reactivateUser("u1");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("DB error");
  });
});

// ── setUserMembershipTier ─────────────────────────────────────────────────────

describe("setUserMembershipTier", () => {
  it("returns error when caller is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const result = await setUserMembershipTier("u1", "lite");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/not authenticated/i);
  });

  it("returns success when tier is set (upsert path)", async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: { is_admin: true } });
    const mockUpsert = jest.fn().mockResolvedValue({ error: null });
    mockFromImpl.mockReturnValueOnce({ select: jest.fn(() => ({ eq: jest.fn(() => ({ maybeSingle: mockMaybeSingle })) })) })
      .mockReturnValueOnce({ upsert: mockUpsert })
      .mockReturnValue({ select: jest.fn(() => ({ eq: jest.fn(() => ({ maybeSingle: jest.fn().mockResolvedValue({ data: { email: "u@test.com" } }) })) })) });

    const result = await setUserMembershipTier("u1", "concierge");
    expect(result.success).toBe(true);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "u1", tier: "concierge" }),
      { onConflict: "user_id" }
    );
    await flush();
    expect(mockTrackHubSpotContact).toHaveBeenCalledWith(
      expect.objectContaining({ ustart_tier: "concierge", ustart_environment: "staging" })
    );
  });

  it("returns error when upsert fails", async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: { is_admin: true } });
    const mockUpsert = jest.fn().mockResolvedValue({ error: { message: "upsert failed" } });
    mockFromImpl.mockReturnValueOnce({ select: jest.fn(() => ({ eq: jest.fn(() => ({ maybeSingle: mockMaybeSingle })) })) })
      .mockReturnValueOnce({ upsert: mockUpsert });

    const result = await setUserMembershipTier("u1", "lite");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("upsert failed");
  });

  it("returns success when tier is null (delete path)", async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: { is_admin: true } });
    const mockDelete = jest.fn(() => ({ eq: jest.fn().mockResolvedValue({ error: null }) }));
    mockFromImpl.mockReturnValueOnce({ select: jest.fn(() => ({ eq: jest.fn(() => ({ maybeSingle: mockMaybeSingle })) })) })
      .mockReturnValueOnce({ delete: mockDelete });

    const result = await setUserMembershipTier("u1", null);
    expect(result.success).toBe(true);
    expect(mockDelete).toHaveBeenCalled();
  });

  it("does not fire HubSpot tracking when user has no email", async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: { is_admin: true } });
    const mockUpsert = jest.fn().mockResolvedValue({ error: null });
    mockFromImpl.mockReturnValueOnce({ select: jest.fn(() => ({ eq: jest.fn(() => ({ maybeSingle: mockMaybeSingle })) })) })
      .mockReturnValueOnce({ upsert: mockUpsert })
      .mockReturnValue({ select: jest.fn(() => ({ eq: jest.fn(() => ({ maybeSingle: jest.fn().mockResolvedValue({ data: { email: null } }) })) })) });

    await setUserMembershipTier("u1", "explore");
    await flush();
    expect(mockTrackHubSpotContact).not.toHaveBeenCalled();
  });

  it("returns a generic error when an unexpected exception is thrown", async () => {
    mockGetUser.mockRejectedValue(new Error("boom"));
    const result = await setUserMembershipTier("u1", "lite");
    expect(result).toEqual({ success: false, error: "Something went wrong. Please try again." });
  });
});
