"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Minimal sign-out button — intended to be placed inside the navbar.
// Calls signOut() on the Supabase browser client (which clears the session cookie),
// then calls router.refresh() to invalidate Next.js's router cache so Server Components
// (like the Navbar) re-render immediately with the updated auth state.
export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className="text-sm text-white/45 hover:text-white transition-colors duration-200"
    >
      Sign Out
    </button>
  );
}
