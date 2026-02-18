import Link from "next/link";

// Full-viewport hero with CSS-only animations. No client JS needed.
// Background layers (dot grid + radial glow) are defined as CSS classes in globals.css
// because Tailwind arbitrary values can't handle complex comma-containing gradient syntax.
export function Hero() {
  return (
    <div className="relative min-h-screen flex items-center justify-center text-center px-6 pt-[120px] pb-20 overflow-hidden">
      {/* Subtle white dot grid across the full background — see .hero-dot-grid in globals.css */}
      <div
        className="hero-dot-grid absolute inset-0 pointer-events-none"
        aria-hidden="true"
      />

      {/* Soft radial glow centered behind content — pulses via animate-pulse-glow */}
      <div
        className="hero-glow absolute top-[20%] left-1/2 w-[680px] h-[420px] pointer-events-none animate-pulse-glow"
        aria-hidden="true"
      />

      {/* Content stack: badge → headline → subtext → CTAs, each with a staggered fadeUp delay */}
      <div className="relative z-[2] max-w-[760px]">
        {/* Pill badge */}
        <div className="inline-flex items-center gap-2 px-[14px] py-[5px] border border-[rgba(255,255,255,0.15)] rounded-full text-[12px] font-medium text-[rgba(255,255,255,0.70)] tracking-[0.04em] uppercase mb-8 animate-fade-up">
          <span className="w-1.5 h-1.5 rounded-full bg-white opacity-60" aria-hidden="true" />
          Built for international students in the US
        </div>

        {/* Main headline — fluid size via clamp() so it scales between mobile and desktop */}
        <h1 className="font-syne font-extrabold text-[clamp(42px,7vw,76px)] leading-[1.05] tracking-[-0.04em] text-white mb-6 animate-fade-up-1">
          Everything you need to thrive in the United States.
        </h1>

        {/* Supporting subheadline */}
        <p className="text-[clamp(16px,2vw,19px)] font-light text-[rgba(255,255,255,0.45)] max-w-[520px] mx-auto mb-12 leading-[1.65] animate-fade-up-2">
          UStart helps international students navigate life in the US — from
          opening a bank account to building credit — so you can focus on what
          matters.
        </p>

        {/* CTAs: primary signup + ghost link that smooth-scrolls to the #features section */}
        <div className="flex items-center justify-center gap-5 flex-wrap animate-fade-up-3">
          <Link
            href="/signup"
            className="inline-flex items-center bg-white text-[#05080F] font-medium text-[15px] py-3 px-7 rounded-lg hover:opacity-90 hover:-translate-y-px transition-all duration-200"
          >
            Create Account
          </Link>
          <Link
            href="#features"
            className="inline-flex items-center gap-1.5 text-sm text-[rgba(255,255,255,0.70)] hover:text-white transition-colors duration-200"
          >
            See what&apos;s inside <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
