/** @jest-environment node */

const mockExchangeCodeForSession = jest.fn();
const mockProfilesUpdate = jest.fn();
const mockInvitationsUpdate = jest.fn();

// Must use relative paths — @/ alias doesn't resolve in the node jest environment.
jest.mock("../../../../../lib/supabase/server", () => ({
  createClient: jest.fn(() => ({
    auth: {
      exchangeCodeForSession: mockExchangeCodeForSession,
    },
  })),
}));

// Service client is used for cross-user writes when handling parent OTP callbacks.
jest.mock("../../../../../lib/supabase", () => ({
  createServiceClient: jest.fn(() => ({
    from: jest.fn((table: string) => {
      if (table === "profiles") {
        const chain = { update: mockProfilesUpdate, eq: jest.fn() };
        (chain.eq as jest.Mock).mockReturnValue(chain);
        mockProfilesUpdate.mockReturnValue(chain);
        return chain;
      }
      const chain = { update: mockInvitationsUpdate, eq: jest.fn() };
      (chain.eq as jest.Mock).mockReturnValue(chain);
      mockInvitationsUpdate.mockReturnValue(chain);
      return chain;
    }),
  })),
}));

jest.mock("next/headers", () => ({
  cookies: jest.fn(() => ({
    getAll: jest.fn(() => []),
    set: jest.fn(),
  })),
}));

import { GET } from "@/app/(auth)/auth/callback/route";
import { NextRequest } from "next/server";

describe("GET /auth/callback", () => {
  beforeEach(() => {
    mockExchangeCodeForSession.mockReset();
    mockProfilesUpdate.mockReset();
    mockInvitationsUpdate.mockReset();
  });

  it("redirects to /dashboard on successful code exchange (student)", async () => {
    mockExchangeCodeForSession.mockResolvedValueOnce({
      data: { user: { id: "user-1", user_metadata: {} } },
      error: null,
    });

    const request = new NextRequest(
      "http://localhost:3000/auth/callback?code=valid-code"
    );
    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/dashboard"
    );
  });

  it("updates profile and invitation when parent OTP metadata is present", async () => {
    mockExchangeCodeForSession.mockResolvedValueOnce({
      data: {
        user: {
          id: "parent-user-id",
          user_metadata: { role: "parent", student_id: "student-123" },
        },
      },
      error: null,
    });

    const request = new NextRequest(
      "http://localhost:3000/auth/callback?code=parent-code"
    );
    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/dashboard"
    );
    expect(mockProfilesUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ role: "parent", student_id: "student-123" })
    );
    expect(mockInvitationsUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: "accepted" })
    );
  });

  it("redirects to /sign-in?error=auth_failed when exchange fails", async () => {
    mockExchangeCodeForSession.mockResolvedValueOnce({
      data: null,
      error: { message: "Invalid token" },
    });

    const request = new NextRequest(
      "http://localhost:3000/auth/callback?code=bad-code"
    );
    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/sign-in?error=auth_failed"
    );
  });

  it("redirects to /sign-in?error=auth_failed when no code is provided", async () => {
    const request = new NextRequest("http://localhost:3000/auth/callback");
    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/sign-in?error=auth_failed"
    );
  });
});
