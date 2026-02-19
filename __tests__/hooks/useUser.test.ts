import { renderHook, act } from "@testing-library/react";
import { useUser } from "@/hooks/useUser";

const mockUnsubscribe = jest.fn();
const mockGetUser = jest.fn();
const mockOnAuthStateChange = jest.fn();

jest.mock("@supabase/ssr", () => ({
  createBrowserClient: jest.fn(() => ({
    auth: {
      getUser: mockGetUser,
      onAuthStateChange: mockOnAuthStateChange,
    },
  })),
}));

describe("useUser", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockOnAuthStateChange.mockReset();
    mockUnsubscribe.mockReset();

    // Default: unauthenticated user
    mockGetUser.mockResolvedValue({ data: { user: null } });
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    });
  });

  it("returns null user initially", () => {
    const { result } = renderHook(() => useUser());
    expect(result.current.user).toBeNull();
  });

  it("starts in loading state", () => {
    const { result } = renderHook(() => useUser());
    expect(result.current.loading).toBe(true);
  });

  it("resolves to loading false after getUser settles", async () => {
    const { result } = renderHook(() => useUser());
    await act(async () => {});
    expect(result.current.loading).toBe(false);
  });

  it("returns a mapped user when getUser resolves with a session", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: {
        user: {
          id: "user-123",
          email: "student@example.com",
          user_metadata: { stripe_customer_id: "cus_abc" },
        },
      },
    });

    const { result } = renderHook(() => useUser());
    await act(async () => {});

    expect(result.current.user).toEqual({
      id: "user-123",
      email: "student@example.com",
      stripeCustomerId: "cus_abc",
    });
  });

  it("unsubscribes from auth state changes on unmount", async () => {
    const { unmount } = renderHook(() => useUser());
    await act(async () => {});
    unmount();
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });
});
