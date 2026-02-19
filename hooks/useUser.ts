"use client";

import { useEffect, useState } from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@/types";

// Map Supabase's AuthUser to the app's lightweight User type.
// user_metadata.stripe_customer_id is set by the Stripe webhook after first purchase.
function toUser(sbUser: SupabaseUser): User {
  return {
    id: sbUser.id,
    email: sbUser.email ?? "",
    stripeCustomerId:
      (sbUser.user_metadata?.stripe_customer_id as string | undefined) ?? null,
  };
}

// Returns the current authenticated user and a loading flag.
// Subscribes to auth state changes so the value stays in sync across tabs
// (e.g. if the user signs out in another tab).
export function useUser(): { user: User | null; loading: boolean } {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // Fetch the current session immediately on mount
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ? toUser(data.user) : null);
      setLoading(false);
    });

    // Keep state in sync with sign-in / sign-out events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? toUser(session.user) : null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}
