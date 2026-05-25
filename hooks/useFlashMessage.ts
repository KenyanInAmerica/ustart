"use client";

import { useEffect, useState } from "react";

/**
 * Returns [message, setMessage]. When message is set to a non-null string it
 * auto-clears back to null after `duration` milliseconds (default 3000).
 * Setting message to null before the timer fires cancels the timer cleanly.
 */
export function useFlashMessage(
  duration = 3000
): [string | null, (msg: string | null) => void] {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), duration);
    return () => clearTimeout(timer);
  }, [message, duration]);

  return [message, setMessage];
}
