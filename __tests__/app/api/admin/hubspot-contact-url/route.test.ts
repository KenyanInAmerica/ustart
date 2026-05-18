/** @jest-environment node */

const mockGetUser = jest.fn();
const mockServiceFrom = jest.fn();

jest.mock("../../../../../lib/supabase/server", () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
}));

jest.mock("../../../../../lib/supabase/service", () => ({
  createServiceClient: jest.fn(() => ({
    from: mockServiceFrom,
  })),
}));

jest.mock("../../../../../lib/hubspot/contacts", () => ({
  getHubSpotContactDirectUrl: jest.fn(),
}));

jest.mock("next/headers", () => ({
  cookies: jest.fn(() => ({ getAll: jest.fn(() => []), set: jest.fn() })),
}));

import { GET } from "@/app/api/admin/hubspot-contact-url/route";
import { NextRequest } from "next/server";
import { getHubSpotContactDirectUrl } from "../../../../../lib/hubspot/contacts";

const mockDirectUrl = getHubSpotContactDirectUrl as jest.Mock;

// Chainable Supabase query stub that resolves maybeSingle() with the given data.
function makeProfileChain(isAdmin: boolean) {
  const chain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest
      .fn()
      .mockResolvedValue({ data: { is_admin: isAdmin } }),
  };
  return chain;
}

function makeRequest(email?: string) {
  const url = email
    ? `http://localhost/api/admin/hubspot-contact-url?email=${encodeURIComponent(email)}`
    : "http://localhost/api/admin/hubspot-contact-url";
  return new NextRequest(url);
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GET /api/admin/hubspot-contact-url", () => {
  it("returns 401 when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const res = await GET(makeRequest("user@test.com"));

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toMatch(/not authenticated/i);
  });

  it("returns 403 when user is not an admin", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
    });
    mockServiceFrom.mockReturnValueOnce(makeProfileChain(false));

    const res = await GET(makeRequest("user@test.com"));

    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toMatch(/forbidden/i);
  });

  it("returns { url: null } when email param is missing", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "admin-1" } },
    });
    mockServiceFrom.mockReturnValueOnce(makeProfileChain(true));

    const res = await GET(makeRequest());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ url: null });
    expect(mockDirectUrl).not.toHaveBeenCalled();
  });

  it("returns { url } when the contact is found", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "admin-1" } },
    });
    mockServiceFrom.mockReturnValueOnce(makeProfileChain(true));
    mockDirectUrl.mockResolvedValue(
      "https://app.hubspot.com/contacts/123/contact/456"
    );

    const res = await GET(makeRequest("user@test.com"));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      url: "https://app.hubspot.com/contacts/123/contact/456",
    });
    expect(mockDirectUrl).toHaveBeenCalledWith("user@test.com");
  });

  it("returns { url: null } when the contact is not found in HubSpot", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "admin-1" } },
    });
    mockServiceFrom.mockReturnValueOnce(makeProfileChain(true));
    mockDirectUrl.mockResolvedValue(null);

    const res = await GET(makeRequest("unknown@test.com"));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ url: null });
  });

  it("returns { url: null } on an unexpected server error", async () => {
    mockGetUser.mockRejectedValue(new Error("DB unavailable"));

    const res = await GET(makeRequest("user@test.com"));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ url: null });
  });
});
