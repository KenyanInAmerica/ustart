"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { brand } from "@/lib/config/brand";
import { GetStartedLink } from "@/components/ui/GetStartedLink";
import { SignOutButton } from "@/components/ui/SignOutButton";

interface NavbarClientProps {
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const navLinkClassName =
  "text-sm font-medium text-[var(--text-mid)] transition-colors duration-200 hover:text-[var(--text)]";

const filledLinkClassName =
  "inline-flex items-center justify-center rounded-[var(--radius-sm)] bg-[var(--accent)] px-5 py-[9px] text-sm font-semibold text-white transition-colors duration-200 hover:bg-[var(--accent-hover)]";

export function NavbarClient({
  isAuthenticated,
  isAdmin,
}: NavbarClientProps) {
  const pathname = usePathname();
  const [hasShadow, setHasShadow] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setHasShadow(window.scrollY > 8);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  return (
    <nav
      className={[
        "fixed left-0 right-0 top-0 z-[100] border-b border-[var(--border)] bg-white transition-shadow duration-200",
        hasShadow ? "shadow-[var(--shadow-sm)]" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="mx-auto flex h-20 max-w-[1280px] items-center justify-between gap-6 px-6 md-900:px-12">
        <Link href="/" className="min-w-0">
          <span className="block font-primary text-xl font-extrabold tracking-[-0.03em] text-[var(--text)]">
            {brand.name}
          </span>
          <span className="block truncate text-xs font-medium uppercase tracking-wide text-[var(--text-mid)]">
            {brand.tagline}
          </span>
        </Link>

        <div className="hidden items-center gap-6 md-900:flex">
          {isAuthenticated ? (
            <>
              {isAdmin && (
                <Link href="/admin" className={navLinkClassName}>
                  Admin
                </Link>
              )}
              <Link href="/dashboard" className={filledLinkClassName}>
                Dashboard
              </Link>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link href="/sign-in" className={navLinkClassName}>
                Sign In
              </Link>
              <GetStartedLink />
            </>
          )}
        </div>

        <button
          type="button"
          aria-expanded={isMenuOpen}
          aria-controls="mobile-nav-menu"
          aria-label="Toggle navigation menu"
          className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] bg-white text-[var(--text)] transition-colors duration-200 hover:bg-[var(--bg-subtle)] md-900:hidden"
          onClick={() => setIsMenuOpen((current) => !current)}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            {isMenuOpen ? (
              <path d="M18 6 6 18M6 6l12 12" />
            ) : (
              <>
                <path d="M4 7h16" />
                <path d="M4 12h16" />
                <path d="M4 17h16" />
              </>
            )}
          </svg>
        </button>
      </div>

      {isMenuOpen && (
        <div
          id="mobile-nav-menu"
          className="border-t border-[var(--border)] bg-white px-6 py-4 shadow-[var(--shadow-sm)] md-900:hidden"
        >
          <div className="flex flex-col gap-3">
            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className={navLinkClassName}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Admin
                  </Link>
                )}
                <Link
                  href="/dashboard"
                  className={filledLinkClassName}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <SignOutButton className="justify-start" />
              </>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className={navLinkClassName}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign In
                </Link>
                <GetStartedLink className="w-full justify-center" />
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
