/** @jest-environment node */

const mockGetUser = jest.fn();
const mockFrom = jest.fn();
const mockServiceFrom = jest.fn();

jest.mock("../../../../lib/supabase/server", () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
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

import { saveWhatsappLink } from "../../../../lib/actions/admin/settings";

function makeChain(returnValue: unknown): Record<string, unknown> {
  const p = Promise.resolve(returnValue);
  const chain: Record<string, unknown> = {
    then: p.then.bind(p),
    catch: p.catch.bind(p),
  };
  const fn: jest.Mock = jest.fn(() => chain);
  chain.select = fn;
  chain.update = fn;
  chain.upsert = fn;
  chain.eq = fn;
  chain.maybeSingle = jest.fn().mockResolvedValue(returnValue);
  return chain;
}

const ADMIN_USER = { id: "admin-user-id" };

describe("saveWhatsappLink", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockFrom.mockReset();
    mockServiceFrom.mockReset();
  });

  it("returns error when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const result = await saveWhatsappLink("https://chat.whatsapp.com/abc");
    expect(result).toEqual({ success: false, error: "Not authenticated." });
  });

  it("returns error when user is not admin", async () => {
    mockGetUser.mockResolvedValue({ data: { user: ADMIN_USER } });
    mockServiceFrom.mockReturnValue(makeChain({ data: { is_admin: false }, error: null }));
    const result = await saveWhatsappLink("https://chat.whatsapp.com/abc");
    expect(result).toEqual({ success: false, error: "Forbidden." });
  });

  it("returns error when link is empty", async () => {
    mockGetUser.mockResolvedValue({ data: { user: ADMIN_USER } });
    mockServiceFrom.mockReturnValue(makeChain({ data: { is_admin: true }, error: null }));
    const result = await saveWhatsappLink("   ");
    expect(result).toEqual({ success: false, error: "Link cannot be empty." });
  });

  it("returns success when link is saved", async () => {
    mockGetUser.mockResolvedValue({ data: { user: ADMIN_USER } });
    // First call: is_admin check (service client)
    mockServiceFrom
      .mockReturnValueOnce(makeChain({ data: { is_admin: true }, error: null }))
      // Second call: upsert to config
      .mockReturnValueOnce(makeChain({ error: null }));

    const result = await saveWhatsappLink("https://chat.whatsapp.com/abc123");
    expect(result).toEqual({ success: true });
  });

  it("returns error when DB upsert fails", async () => {
    mockGetUser.mockResolvedValue({ data: { user: ADMIN_USER } });
    mockServiceFrom
      .mockReturnValueOnce(makeChain({ data: { is_admin: true }, error: null }))
      .mockReturnValueOnce(makeChain({ error: { message: "DB constraint violation" } }));

    const result = await saveWhatsappLink("https://chat.whatsapp.com/abc123");
    expect(result).toEqual({ success: false, error: "DB constraint violation" });
  });
});
