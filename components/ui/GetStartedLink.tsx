"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface GetStartedLinkProps {
  className?: string;
}

// Hides the "Get Started" CTA when the user is already on /pricing — linking
// to the current page is redundant. Rendered by the server-component Navbar,
// which can't call usePathname() directly.
export function GetStartedLink({ className }: GetStartedLinkProps) {
  const pathname = usePathname();

  if (pathname === "/pricing") return null;

  return (
    <Link
      href="/pricing"
      className={[
        "inline-flex items-center justify-center rounded-[var(--radius-sm)] bg-[var(--accent)] px-5 py-[9px] text-sm font-semibold text-white transition-colors duration-200 hover:bg-[var(--accent-hover)]",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      Get Started
    </Link>
  );
}
