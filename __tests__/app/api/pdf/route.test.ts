/** @jest-environment node */
// Tests for GET /api/pdf route handler.
// Covers: missing param, unauthenticated, not found, unauthorized, and authorized responses.

import { NextRequest } from "next/server";
import { GET } from "@/app/api/pdf/route";

// Mock Supabase clients — server client for auth, service client for DB/Storage queries.
jest.mock("../../../../lib/supabase/server", () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: "user-1", email: "test@example.com" } },
      }),
    },
  })),
}));

const mockServiceFrom = jest.fn();
jest.mock("../../../../lib/supabase/service", () => ({
  createServiceClient: jest.fn(() => ({
    from: mockServiceFrom,
  })),
}));

jest.mock("../../../../lib/pdf/fetch", () => ({
  fetchAndWatermarkPdf: jest.fn().mockResolvedValue(new Uint8Array([37, 80, 68, 70])), // %PDF
}));

function makeRequest(url: string) {
  return new NextRequest(url);
}

// Helper: chain .select().eq().maybeSingle() returning the given data.
function chainedQuery(data: unknown) {
  const chain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({ data }),
  };
  return chain;
}

describe("GET /api/pdf", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 when content_item_id is missing", async () => {
    const res = await GET(makeRequest("http://localhost/api/pdf"));
    expect(res.status).toBe(400);
  });

  it("returns 401 when user is not authenticated", async () => {
    const { createClient } = jest.requireMock("../../../../lib/supabase/server");
    (createClient as jest.Mock).mockReturnValueOnce({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
      },
    });
    const res = await GET(makeRequest("http://localhost/api/pdf?content_item_id=abc"));
    expect(res.status).toBe(401);
  });

  it("returns 404 when content item does not exist", async () => {
    // content_items query returns null
    mockServiceFrom.mockReturnValue(chainedQuery(null));
    const res = await GET(makeRequest("http://localhost/api/pdf?content_item_id=abc"));
    expect(res.status).toBe(404);
  });

  it("returns 403 when user is not entitled to a tier item", async () => {
    // content_items row (tier-based, rank required >= 2)
    const contentItem = { id: "abc", tier: "pro", file_path: "pdfs/pro/file.pdf", is_individual_only: false };
    // user_access row with rank 1 (below pro threshold)
    const userAccess = { membership_rank: 1, has_explore: false, has_concierge: false, has_parent_seat: false };
    // profiles row (student, no student_id)
    const profile = { role: "student", student_id: null };
    const profileEmail = { email: "test@example.com" };

    let callCount = 0;
    mockServiceFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return chainedQuery(contentItem); // content_items
      if (callCount === 2) return chainedQuery(profile);     // profiles (role)
      if (callCount === 3) return chainedQuery(userAccess);  // user_access
      return chainedQuery(profileEmail);
    });

    const res = await GET(makeRequest("http://localhost/api/pdf?content_item_id=abc"));
    expect(res.status).toBe(403);
  });

  it("returns 200 binary PDF response when user is entitled", async () => {
    const contentItem = { id: "abc", tier: "lite", file_path: "pdfs/lite/file.pdf", is_individual_only: false };
    const userAccess = { membership_rank: 1, has_explore: false, has_concierge: false, has_parent_seat: false };
    const profile = { role: "student", student_id: null };
    const profileEmail = { email: "test@example.com" };

    let callCount = 0;
    mockServiceFrom.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return chainedQuery(contentItem);
      if (callCount === 2) return chainedQuery(profile);
      if (callCount === 3) return chainedQuery(userAccess);
      return chainedQuery(profileEmail);
    });

    const res = await GET(makeRequest("http://localhost/api/pdf?content_item_id=abc"));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
    expect(res.headers.get("Content-Disposition")).toBe("inline");
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
  });
});
