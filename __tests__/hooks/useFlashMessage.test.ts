import { act, renderHook } from "@testing-library/react";
import { useFlashMessage } from "@/hooks/useFlashMessage";

describe("useFlashMessage", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("initialises with null message", () => {
    const { result } = renderHook(() => useFlashMessage());
    expect(result.current[0]).toBeNull();
  });

  it("stores the message when set", () => {
    const { result } = renderHook(() => useFlashMessage());
    act(() => {
      result.current[1]("Saved successfully.");
    });
    expect(result.current[0]).toBe("Saved successfully.");
  });

  it("auto-clears to null after the default 3000ms", () => {
    const { result } = renderHook(() => useFlashMessage());

    act(() => {
      result.current[1]("Profile updated.");
    });
    expect(result.current[0]).toBe("Profile updated.");

    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(result.current[0]).toBeNull();
  });

  it("does not clear before the duration elapses", () => {
    const { result } = renderHook(() => useFlashMessage());

    act(() => {
      result.current[1]("Not yet gone.");
    });

    act(() => {
      jest.advanceTimersByTime(2999);
    });
    expect(result.current[0]).toBe("Not yet gone.");
  });

  it("respects a custom duration", () => {
    const { result } = renderHook(() => useFlashMessage(1500));

    act(() => {
      result.current[1]("Quick flash.");
    });

    act(() => {
      jest.advanceTimersByTime(1499);
    });
    expect(result.current[0]).toBe("Quick flash.");

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current[0]).toBeNull();
  });

  it("setting message to null before timeout cancels the timer", () => {
    const { result } = renderHook(() => useFlashMessage());

    act(() => {
      result.current[1]("Will be cancelled.");
    });
    act(() => {
      result.current[1](null);
    });

    expect(result.current[0]).toBeNull();

    // Timer should not fire and try to set state on an unmounted hook
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(result.current[0]).toBeNull();
  });

  it("resets the timer when a new message is set before the previous one clears", () => {
    const { result } = renderHook(() => useFlashMessage());

    act(() => {
      result.current[1]("First message.");
    });

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    act(() => {
      result.current[1]("Second message.");
    });

    act(() => {
      jest.advanceTimersByTime(2000);
    });
    // Second message was set 2000ms ago — still within 3000ms window
    expect(result.current[0]).toBe("Second message.");

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current[0]).toBeNull();
  });
});
