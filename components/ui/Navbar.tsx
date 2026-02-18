import Link from "next/link";

// Fixed top navigation bar. Stays visible while scrolling (z-[100]).
// Semi-transparent bg + backdrop-blur let the page content show through as you scroll.
export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-6 md-900:px-12 h-16 bg-[rgba(5,8,15,0.85)] backdrop-blur-[16px] border-b border-[rgba(255,255,255,0.07)]">
      {/* Wordmark — links back to home */}
      <Link
        href="/"
        className="font-syne font-extrabold text-xl tracking-[-0.03em] text-white"
      >
        UStart
      </Link>

      {/* Right-side actions: muted Sign In + solid Get Started CTA */}
      <div className="flex items-center gap-6">
        <Link
          href="/login"
          className="text-sm text-[rgba(255,255,255,0.45)] hover:text-white transition-colors duration-200"
        >
          Sign In
        </Link>
        <Link
          href="/signup"
          className="inline-flex items-center bg-white text-[#05080F] text-sm font-medium px-5 py-[9px] rounded-lg hover:opacity-90 hover:-translate-y-px transition-all duration-[150ms]"
        >
          Get Started
        </Link>
      </div>
    </nav>
  );
}
