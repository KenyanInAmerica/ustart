const steps = [
  {
    num: "01",
    title: "Choose your plan",
    desc: "Pick the tier that matches where you are in your US journey.",
  },
  {
    num: "02",
    title: "Access your portal",
    desc: "Log in instantly and unlock resources and content.",
  },
  {
    num: "03",
    title: "Start making progress",
    desc: "Work through step-by-step guides on banking, credit, taxes, and everything in between.",
  },
];

// Three-step onboarding overview rendered in a 3-column grid.
// Steps are separated by a border that switches direction based on viewport:
//   - mobile: border-bottom (stacked vertically)
//   - desktop (md-900+): border-right (side by side)
// The last step gets no separator in either layout.
export function HowItWorks() {
  return (
    <section className="py-[72px] px-6 md-900:py-[100px] md-900:px-12 max-w-[1160px] mx-auto">
      <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[rgba(255,255,255,0.45)] mb-4">
        Process
      </p>
      <h2 className="font-syne font-bold text-[clamp(28px,4vw,42px)] tracking-[-0.03em] text-white mb-14 max-w-[480px]">
        Three steps to get started.
      </h2>

      <div className="grid grid-cols-1 md-900:grid-cols-3">
        {steps.map((step, i) => (
          <div
            key={step.num}
            className={[
              "py-8 px-0 md-900:py-10 md-900:px-10",
              // Add separator after every step except the last
              i < steps.length - 1
                ? "border-b border-[rgba(255,255,255,0.07)] md-900:border-b-0 md-900:border-r md-900:border-[rgba(255,255,255,0.07)]"
                : "",
            ].join(" ")}
          >
            {/* Ghost step number — very low opacity, purely decorative */}
            <div className="font-syne font-extrabold text-[72px] leading-none tracking-[-0.04em] text-[rgba(255,255,255,0.04)] mb-6">
              {step.num}
            </div>
            <h3 className="font-syne font-bold text-lg text-white mb-2.5">
              {step.title}
            </h3>
            <p className="text-sm text-[rgba(255,255,255,0.45)] leading-[1.65]">
              {step.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
