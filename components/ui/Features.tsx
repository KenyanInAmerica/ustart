import { Card } from "@/components/ui/Card";

const features = [
  {
    label: "Plane Departure",
    heading: "Land ready, not rattled",
    description: "Step-by-step guidance from pre-departure through your first week — so nothing catches you off guard at the airport or after.",
  },
  {
    label: "Calendar Check",
    heading: "Your first 7 days, planned",
    description: "One important task per day. Banking, phone, campus setup — broken down so it never piles up and never feels overwhelming.",
  },
  {
    label: "Banking & Finance",
    heading: "Banking & money under control",
    description: "Open a U.S. account, set up transfers, and stop losing money to fees you didn't know existed. Built from real first-year experience.",
  },
  {
    label: "Parent Pack",
    heading: "Your parents won't panic",
    description: "A dedicated parent guide so the people back home understand what you're going through — and how to support you without adding pressure.",
  },
  {
    label: "Community",
    heading: "Matched with someone who's been there",
    description: "Connect with a UStart alumnus from your sport and region — someone who made this exact move and can tell you what nobody else will.",
  },
  {
    label: "Admin & Compliance",
    heading: "The stuff that trips everyone up",
    description: "Insurance, SSN, health centre, academic eligibility — the hidden admin that derails students who weren't warned. You will be.",
  },
];

export function Features() {
  return (
    <section
      id="features"
      className="mx-auto max-w-[1160px] px-6 py-[72px] md-900:px-12 md-900:py-[100px]"
    >
      <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text)]">
        What&apos;s Included
      </p>
      <h2 className="mb-14 max-w-[480px] font-primary text-[clamp(28px,4vw,42px)] font-bold tracking-[-0.03em] text-[var(--text)]">
        Everything in one place.
      </h2>

      <div className="grid grid-cols-1 gap-5 md-900:grid-cols-3">
        {features.map((feature) => (
          <Card
            key={feature.heading}
            className="rounded-2xl border border-[var(--border)] transition-colors duration-200 hover:bg-[var(--bg-card-hover)]"
            padding="md"
            shadow="md"
          >
            <p className="mb-4 text-left text-xs font-semibold uppercase tracking-widest text-[#3083DC]">
              {feature.label}
            </p>
            <h3 className="mb-2 text-base font-semibold text-[#1C2B3A]">
              {feature.heading}
            </h3>
            <p className="text-sm leading-relaxed text-[var(--text-muted)]">
              {feature.description}
            </p>
          </Card>
        ))}
      </div>
    </section>
  );
}
