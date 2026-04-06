"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/actions/signOut";

// Dashboard sign-out button — delegates to a server action so sign-out can be
// logged server-side before the session is cleared.
export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  return (
    <button
      onClick={handleSignOut}
      className="flex items-center gap-2 w-full px-3 py-2 mt-1 rounded-lg text-[13px] text-white/[0.42] hover:text-white hover:bg-white/[0.05] transition-colors duration-150 text-left cursor-pointer"
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
    </button>
  );
}
