"use client";

import type { ButtonHTMLAttributes } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface SignOutButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {}

// Minimal sign-out button — intended to be placed inside the navbar.
// Calls signOut() on the Supabase browser client (which clears the session cookie),
// then calls router.refresh() to invalidate Next.js's router cache so Server Components
// (like the Navbar) re-render immediately with the updated auth state.
export function SignOutButton({
  className,
  type = "button",
  ...props
}: SignOutButtonProps) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  }

  return (
    <button
      type={type}
      onClick={handleSignOut}
      className={[
        "inline-flex items-center text-sm font-medium text-[var(--text-muted)] transition-colors duration-200 hover:text-[var(--destructive)]",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      Sign Out
    </button>
  );
}
