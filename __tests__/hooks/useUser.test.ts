import { renderHook, act } from "@testing-library/react";
import { useUser } from "@/hooks/useUser";

describe("useUser", () => {
  it("returns null user initially", () => {
    const { result } = renderHook(() => useUser());
    expect(result.current.user).toBeNull();
  });

  it("returns loading false after mount", async () => {
    const { result } = renderHook(() => useUser());
    await act(async () => {});
    expect(result.current.loading).toBe(false);
  });
});
