/** @jest-environment node */

const mockExchangeCodeForSession = jest.fn();

jest.mock("@supabase/ssr", () => ({
  createServerClient: jest.fn(() => ({
    auth: {
      exchangeCodeForSession: mockExchangeCodeForSession,
    },
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
  });

  it("redirects to /dashboard on successful code exchange", async () => {
    mockExchangeCodeForSession.mockResolvedValueOnce({ error: null });

    const request = new NextRequest(
      "http://localhost:3000/auth/callback?code=valid-code"
    );
    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/dashboard"
    );
  });

  it("redirects to /sign-in?error=auth_failed when exchange fails", async () => {
    mockExchangeCodeForSession.mockResolvedValueOnce({
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
