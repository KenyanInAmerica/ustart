import Link from "next/link";

export function Hero() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--bg)] px-6 pb-20 pt-[120px] text-center">
      <div
        className="hero-dot-grid pointer-events-none absolute inset-0 opacity-40"
        aria-hidden="true"
      />

      <div
        className="hero-glow pointer-events-none absolute left-1/2 top-[20%] h-[420px] w-[680px] animate-pulse-glow opacity-40"
        aria-hidden="true"
      />

      <div className="relative z-[2] max-w-[760px]">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[var(--border-md)] bg-white px-[14px] py-[5px] text-[12px] font-medium uppercase tracking-[0.04em] text-[var(--text-mid)] animate-fade-up">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] opacity-80" aria-hidden="true" />
          Built for international students in the US
        </div>

        <h1 className="mb-6 font-primary text-[clamp(42px,7vw,76px)] font-extrabold leading-[1.05] tracking-[-0.04em] text-[var(--text)] animate-fade-up-1">
          Everything you need to thrive in the United States.
        </h1>

        <p className="mx-auto mb-12 max-w-[520px] text-[clamp(16px,2vw,19px)] font-light leading-[1.65] text-[var(--text-muted)] animate-fade-up-2">
          UStart helps international students navigate life in the US — from opening a bank account to building credit — so you can focus on what matters.
        </p>

        <div className="flex items-center justify-center animate-fade-up-3">
          <Link
            href="#features"
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--accent)] px-6 py-2.5 text-sm font-semibold text-[var(--accent)] transition-colors duration-200 hover:bg-[var(--accent)]/5"
          >
            See what&apos;s inside <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
