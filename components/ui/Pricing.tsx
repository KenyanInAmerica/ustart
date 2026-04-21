import Link from "next/link";

import { Card } from "@/components/ui/Card";

function CheckIcon() {
  return (
    <svg
      className="mt-0.5 h-[14px] w-[14px] shrink-0 text-[var(--accent)]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

const plans = [
  {
    name: "Lite",
    price: "$49",
    cadence: "one-time · lifetime access",
    featured: false,
    features: [
      "Core content library",
      "PDF resources & downloads",
      "Student account access",
    ],
  },
  {
    name: "Explore",
    price: "$9.99",
    cadence: "per month",
    featured: true,
    features: [
      "Everything in Lite",
      "Deeper settling-in guidance",
      "More detailed planning support",
      "Subscription upgrade path",
    ],
  },
  {
    name: "Concierge",
    price: "$19.99",
    cadence: "per month",
    featured: false,
    features: [
      "Everything in Explore",
      "Highest-tier support guidance",
      "Advanced long-term success resources",
    ],
  },
];

export function Pricing() {
  return (
    <section className="mx-auto max-w-[1160px] px-6 py-[72px] md-900:px-12 md-900:py-[100px]">
      <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text)]">
        Pricing
      </p>
      <h2 className="mb-14 max-w-[480px] font-primary text-[clamp(28px,4vw,42px)] font-bold tracking-[-0.03em] text-[var(--text)]">
        Start where you are.
      </h2>

      <div className="grid grid-cols-1 items-start gap-5 md-900:grid-cols-3">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={[
              "relative mt-3 flex h-full flex-col border transition-all duration-200",
              plan.featured
                ? "border-2 border-[var(--accent)] shadow-[var(--shadow-lg)]"
                : "border-[var(--border-md)] hover:border-[var(--border-hi)] hover:shadow-[var(--shadow-lg)]",
            ].join(" ")}
            padding="lg"
            shadow="md"
          >
            {plan.featured && (
              <span className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full border border-[var(--accent)] bg-[var(--accent)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-white shadow-[var(--shadow-sm)]">
                Most Popular
              </span>
            )}

            <p className="mb-3 font-primary text-[15px] font-bold uppercase tracking-[0.08em] text-[var(--text-mid)]">
              {plan.name}
            </p>
            <p className="mb-1.5 font-primary text-[42px] font-extrabold leading-none tracking-[-0.04em] text-[var(--text)]">
              {plan.price}
            </p>
            <p className="mb-7 text-[13px] text-[var(--text-muted)]">
              {plan.cadence}
            </p>

            <div className="mb-6 h-px bg-[var(--border)]" />

            <ul className="mb-8 flex flex-col gap-3">
              {plan.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2.5 text-[13.5px] text-[var(--text-muted)]"
                >
                  <CheckIcon />
                  {feature}
                </li>
              ))}
            </ul>

            <div className="mt-auto">
              <Link
                href="/pricing"
                className="inline-flex min-h-10 w-full items-center justify-center rounded-[var(--radius-sm)] bg-[var(--accent)] px-4 py-2.5 text-center font-primary text-sm font-semibold text-white transition-colors duration-200 hover:bg-[var(--accent-hover)]"
              >
                Get Started
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
