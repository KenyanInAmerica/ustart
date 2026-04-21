"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/actions/signOut";
import { Button } from "@/components/ui/Button";

// Dashboard sign-out button — delegates to a server action so sign-out can be
// logged server-side before the session is cleared.
export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  return (
    <Button
      onClick={handleSignOut}
      variant="ghost"
      className="mt-1 w-full justify-start"
    >
      {/* Log-out icon */}
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
      Sign out
    </Button>
  );
}
