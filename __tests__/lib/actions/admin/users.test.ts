/** @jest-environment node */

// ── Shared mock setup ─────────────────────────────────────────────────────────

const mockMaybeSingle = jest.fn();
const mockUpdate = jest.fn();
const mockDeleteAuth = jest.fn();
const mockGetUser = jest.fn();
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
const mockRevalidatePath = jest.fn(); // unused but kept for future assertions

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
} from "../../../../lib/actions/admin/users";

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
    update: jest.fn(() => ({
      eq: jest.fn(() => mockUpdate()),
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
    // requireAdmin: maybeSingle returns is_admin: true for the caller.
    mockMaybeSingle.mockResolvedValueOnce({ data: { is_admin: true } });
    mockUpdate.mockResolvedValue({ error: null });

    const result = await reactivateUser("u1");
    expect(result.success).toBe(true);
  });

  it("returns error when DB update fails", async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: { is_admin: true } });
    mockUpdate.mockResolvedValue({ error: { message: "DB error" } });

    const result = await reactivateUser("u1");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("DB error");
  });
});
