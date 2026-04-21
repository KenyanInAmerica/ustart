import { Card } from "@/components/ui/Card";

const steps = [
  {
    num: "01",
    title: "Choose your plan",
    desc: "Pick the tier that fits your needs for where you are in your US journey.",
  },
  {
    num: "02",
    title: "Access your portal",
    desc: "Sign in instantly and unlock resources and content.",
  },
  {
    num: "03",
    title: "Start making progress",
    desc: "Work through step-by-step guides on banking, credit, taxes, and everything in between.",
  },
];

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-[1160px] px-6 py-[72px] md-900:px-12 md-900:py-[100px]">
      <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text)]">
        Process
      </p>
      <h2 className="mb-14 max-w-[480px] font-primary text-[clamp(28px,4vw,42px)] font-bold tracking-[-0.03em] text-[var(--text)]">
        Three steps to get started.
      </h2>

      <div className="grid grid-cols-1 gap-5 md-900:grid-cols-3">
        {steps.map((step) => (
          <Card
            key={step.num}
            className="border border-[var(--border-md)]"
            padding="lg"
            shadow="md"
          >
            <div className="mb-6 font-primary text-[72px] font-extrabold leading-none tracking-[-0.04em] text-[var(--accent)]/15">
              {step.num}
            </div>
            <h3 className="mb-2.5 font-primary text-lg font-bold text-[var(--text)]">
              {step.title}
            </h3>
            <p className="text-sm leading-[1.65] text-[var(--text-muted)]">
              {step.desc}
            </p>
          </Card>
        ))}
      </div>
    </section>
  );
}
