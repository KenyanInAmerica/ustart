/** @jest-environment node */

const mockGetUser = jest.fn();
const mockServiceFrom = jest.fn();

jest.mock("../../../../lib/supabase/server", () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
}));

jest.mock("../../../../lib/supabase/service", () => ({
  createServiceClient: jest.fn(() => ({
    from: mockServiceFrom,
  })),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

jest.mock("../../../../lib/audit/log", () => ({ logAction: jest.fn() }));

import { grantAdminAccess, revokeAdminAccess } from "../../../../lib/actions/admin/admins";

function makeChain(returnValue: unknown): Record<string, unknown> {
  const p = Promise.resolve(returnValue);
  const chain: Record<string, unknown> = {
    then: p.then.bind(p),
    catch: p.catch.bind(p),
  };
  const fn: jest.Mock = jest.fn(() => chain);
  chain.select = fn;
  chain.update = fn;
  chain.eq = fn;
  chain.maybeSingle = jest.fn().mockResolvedValue(returnValue);
  return chain;
}

const ADMIN_USER = { id: "admin-id" };

describe("grantAdminAccess", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockServiceFrom.mockReset();
  });

  it("returns error when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const result = await grantAdminAccess("target@example.com");
    expect(result).toEqual({ success: false, error: "Not authenticated." });
  });

  it("returns error when caller is not admin", async () => {
    mockGetUser.mockResolvedValue({ data: { user: ADMIN_USER } });
    mockServiceFrom.mockReturnValue(makeChain({ data: { is_admin: false }, error: null }));
    const result = await grantAdminAccess("target@example.com");
    expect(result).toEqual({ success: false, error: "Forbidden." });
  });

  it("returns error when target user not found", async () => {
    mockGetUser.mockResolvedValue({ data: { user: ADMIN_USER } });
    // is_admin check passes
    mockServiceFrom
      .mockReturnValueOnce(makeChain({ data: { is_admin: true }, error: null }))
      // user_access lookup returns null
      .mockReturnValueOnce(makeChain({ data: null, error: null }));

    const result = await grantAdminAccess("missing@example.com");
    expect(result).toEqual({ success: false, error: "No account found for that email address." });
  });

  it("returns success when admin access is granted", async () => {
    mockGetUser.mockResolvedValue({ data: { user: ADMIN_USER } });
    mockServiceFrom
      .mockReturnValueOnce(makeChain({ data: { is_admin: true }, error: null }))
      .mockReturnValueOnce(makeChain({ data: { id: "target-id" }, error: null }))
      .mockReturnValueOnce(makeChain({ error: null }));

    const result = await grantAdminAccess("target@example.com");
    expect(result).toEqual({ success: true });
  });
});

describe("revokeAdminAccess", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockServiceFrom.mockReset();
  });

  it("returns error when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const result = await revokeAdminAccess("target-id");
    expect(result).toEqual({ success: false, error: "Not authenticated." });
  });

  it("returns error when caller tries to revoke their own access", async () => {
    mockGetUser.mockResolvedValue({ data: { user: ADMIN_USER } });
    mockServiceFrom.mockReturnValue(makeChain({ data: { is_admin: true }, error: null }));
    const result = await revokeAdminAccess("admin-id"); // same as ADMIN_USER.id
    expect(result).toEqual({ success: false, error: "You cannot revoke your own admin access." });
  });

  it("returns success when admin access is revoked", async () => {
    mockGetUser.mockResolvedValue({ data: { user: ADMIN_USER } });
    mockServiceFrom
      .mockReturnValueOnce(makeChain({ data: { is_admin: true }, error: null })) // requireAdmin
      .mockReturnValueOnce(makeChain({ data: { email: "target@example.com" }, error: null })) // email lookup
      .mockReturnValueOnce(makeChain({ error: null })); // update

    const result = await revokeAdminAccess("other-user-id");
    expect(result).toEqual({ success: true });
  });
});
