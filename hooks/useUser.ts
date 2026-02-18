"use client";

import { useEffect, useState } from "react";
import type { User } from "@/types";

export function useUser(): { user: User | null; loading: boolean } {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  void setUser;

  return { user, loading };
}
