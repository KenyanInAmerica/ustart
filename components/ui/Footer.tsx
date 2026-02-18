import Link from "next/link";

// Minimal site footer: wordmark, legal/utility links, and copyright.
// Stacks vertically on mobile (max-[900px]) and goes horizontal at 900px+.
export function Footer() {
  return (
    <footer className="border-t border-[rgba(255,255,255,0.07)] px-6 py-7 md-900:px-12 md-900:py-8 flex items-center justify-between flex-wrap gap-4 max-[900px]:flex-col max-[900px]:items-start">
      {/* Wordmark */}
      <Link
        href="/"
        className="font-syne font-extrabold text-base tracking-[-0.03em] text-white"
      >
        UStart
      </Link>

      {/* Legal and utility links */}
      <div className="flex items-center gap-7">
        <Link href="/privacy" className="text-[13px] text-[rgba(255,255,255,0.45)] hover:text-white transition-colors duration-200">
          Privacy Policy
        </Link>
        <Link href="/terms" className="text-[13px] text-[rgba(255,255,255,0.45)] hover:text-white transition-colors duration-200">
          Terms
        </Link>
        <Link href="/contact" className="text-[13px] text-[rgba(255,255,255,0.45)] hover:text-white transition-colors duration-200">
          Contact
        </Link>
      </div>

      <span className="text-[13px] text-[rgba(255,255,255,0.45)]">
        &copy; 2026 UStart. All rights reserved.
      </span>
    </footer>
  );
}
