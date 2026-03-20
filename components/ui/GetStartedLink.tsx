"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Hides the "Get Started" CTA when the user is already on /pricing — linking
// to the current page is redundant. Rendered by the server-component Navbar,
// which can't call usePathname() directly.
export function GetStartedLink() {
  const pathname = usePathname();

  if (pathname === "/pricing") return null;

  return (
    <Link
      href="/pricing"
      className="inline-flex items-center bg-white text-[#05080F] text-sm font-medium px-5 py-[9px] rounded-lg hover:opacity-90 hover:-translate-y-px transition-all duration-[150ms]"
    >
      Get Started
    </Link>
  );
}
