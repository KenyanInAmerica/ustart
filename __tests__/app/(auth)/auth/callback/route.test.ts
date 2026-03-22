/** @jest-environment node */

const mockExchangeCodeForSession = jest.fn();
const mockSignOut = jest.fn();
const mockServerFrom = jest.fn();
const mockServiceFrom = jest.fn();

// Must use relative paths — @/ alias doesn't resolve in the node jest environment.
jest.mock("../../../../../lib/supabase/server", () => ({
  createClient: jest.fn(() => ({
    auth: {
      exchangeCodeForSession: mockExchangeCodeForSession,
      signOut: mockSignOut,
    },
    from: mockServerFrom,
  })),
}));

// Service client is used for read/write guards when handling parent OTP callbacks.
jest.mock("../../../../../lib/supabase/service", () => ({
  createServiceClient: jest.fn(() => ({
    from: mockServiceFrom,
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

// Creates a read chain that resolves maybeSingle() with `result`.
function makeReadChain(result: unknown) {
  const chain: Record<string, jest.Mock> = {} as Record<string, jest.Mock>;
  const eqFn = jest.fn(() => chain);
  chain.select = jest.fn(() => chain);
  chain.eq = eqFn;
  chain.maybeSingle = jest.fn().mockResolvedValue(result);
  return chain;
}

// Creates a write chain — update().eq() resolves cleanly.
function makeWriteChain() {
  const chain: Record<string, unknown> = {};
  const eqFn = jest.fn(() => chain);
  chain.update = jest.fn(() => chain);
  chain.eq = eqFn;
  // Thenable so `await ...update(...).eq(...)` resolves without error.
  const resolved = Promise.resolve(undefined);
  chain.then = resolved.then.bind(resolved);
  return chain;
}

// Returns an active-profile chain for the server-side is_active check.
function makeActiveProfile() {
  return makeReadChain({ data: { is_active: true } });
}

describe("GET /auth/callback", () => {
  beforeEach(() => {
    mockExchangeCodeForSession.mockReset();
    mockSignOut.mockReset();
    mockServerFrom.mockReset();
    mockServiceFrom.mockReset();
    mockSignOut.mockResolvedValue(undefined);
  });

  it("redirects to /dashboard on successful code exchange (student)", async () => {
    mockExchangeCodeForSession.mockResolvedValueOnce({
      data: { user: { id: "user-1", user_metadata: {} } },
      error: null,
    });
    mockServerFrom.mockReturnValueOnce(makeActiveProfile());

    const request = new NextRequest(
      "http://localhost:3000/auth/callback?code=valid-code"
    );
    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/dashboard"
    );
  });

  it("redirects to /auth/error?error=account_deactivated for inactive users", async () => {
    mockExchangeCodeForSession.mockResolvedValueOnce({
      data: { user: { id: "inactive-user", user_metadata: {} } },
      error: null,
    });
    // is_active = false — account has been soft-deleted.
    mockServerFrom.mockReturnValueOnce(makeReadChain({ data: { is_active: false } }));

    const request = new NextRequest(
      "http://localhost:3000/auth/callback?code=inactive-code"
    );
    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/auth/error?error=account_deactivated"
    );
    expect(mockSignOut).toHaveBeenCalledTimes(1);
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

    // Server client: is_active check (active).
    mockServerFrom.mockReturnValueOnce(makeActiveProfile());
    // Service client: profiles read → not yet linked; invitations read → pending exists;
    // then profiles write + invitations write.
    mockServiceFrom
      .mockReturnValueOnce(makeReadChain({ data: { student_id: null } }))
      .mockReturnValueOnce(makeReadChain({ data: { id: "inv-1" } }))
      .mockReturnValueOnce(makeWriteChain())
      .mockReturnValueOnce(makeWriteChain());

    const request = new NextRequest(
      "http://localhost:3000/auth/callback?code=parent-code"
    );
    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/dashboard"
    );
    // Two reads + two writes = 4 service client calls.
    expect(mockServiceFrom).toHaveBeenCalledTimes(4);
  });

  it("skips re-linking when parent profile is already linked to a student", async () => {
    mockExchangeCodeForSession.mockResolvedValueOnce({
      data: {
        user: {
          id: "parent-user-id",
          user_metadata: { role: "parent", student_id: "student-123" },
        },
      },
      error: null,
    });

    // Server client: is_active check (active).
    mockServerFrom.mockReturnValueOnce(makeActiveProfile());
    // profiles read → already linked; both reads made but link block is skipped.
    mockServiceFrom
      .mockReturnValueOnce(makeReadChain({ data: { student_id: "student-123" } }))
      .mockReturnValueOnce(makeReadChain({ data: { id: "inv-1" } }));

    const request = new NextRequest(
      "http://localhost:3000/auth/callback?code=relogin-code"
    );
    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/dashboard"
    );
    // Only 2 reads — no writes because profile already has student_id set.
    expect(mockServiceFrom).toHaveBeenCalledTimes(2);
  });

  it("skips re-linking when no pending invitation exists", async () => {
    mockExchangeCodeForSession.mockResolvedValueOnce({
      data: {
        user: {
          id: "parent-user-id",
          user_metadata: { role: "parent", student_id: "student-123" },
        },
      },
      error: null,
    });

    // Server client: is_active check (active).
    mockServerFrom.mockReturnValueOnce(makeActiveProfile());
    // profiles read → unlinked; invitations read → cancelled/consumed (null).
    mockServiceFrom
      .mockReturnValueOnce(makeReadChain({ data: { student_id: null } }))
      .mockReturnValueOnce(makeReadChain({ data: null }));

    const request = new NextRequest(
      "http://localhost:3000/auth/callback?code=unlinked-code"
    );
    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/dashboard"
    );
    // Only 2 reads — no writes because no pending invitation exists.
    expect(mockServiceFrom).toHaveBeenCalledTimes(2);
  });

  it("redirects to /auth/error when exchange fails", async () => {
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
      "http://localhost:3000/auth/error"
    );
  });

  it("redirects to /auth/error when no code is provided", async () => {
    const request = new NextRequest("http://localhost:3000/auth/callback");
    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/auth/error"
    );
  });
});
