import Link from "next/link";

// Small check icon used in the feature list of each plan card.
function CheckIcon() {
  return (
    <svg
      className="shrink-0 mt-0.5 opacity-50"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="2"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// All plans are one-time lifetime purchases. Subscriptions are only available
// as add-ons for existing members and are not shown here.
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
    name: "Basic",
    price: "$99",
    cadence: "one-time · lifetime access",
    featured: true, // Highlighted with "Most Popular" pill and an inverted CTA button
    features: [
      "Everything in Lite",
      "Full content library access",
      "Parent Pack (optional add-on)",
      "Community access",
    ],
  },
  {
    name: "Premium",
    price: "$199",
    cadence: "one-time · lifetime access",
    featured: false,
    features: [
      "Everything in Basic",
      "Priority support",
      "1-on-1 guidance sessions",
      "Parent Pack add-on included",
    ],
  },
];

export function Pricing() {
  return (
    <section className="py-[72px] px-6 md-900:py-[100px] md-900:px-12 max-w-[1160px] mx-auto">
      <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[rgba(255,255,255,0.45)] mb-4">
        Pricing
      </p>
      <h2 className="font-syne font-bold text-[clamp(28px,4vw,42px)] tracking-[-0.03em] text-white mb-14 max-w-[480px]">
        Start where you are.
      </h2>

      <div className="grid grid-cols-1 md-900:grid-cols-3 gap-4 items-start">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={[
              "relative rounded-2xl px-7 py-9 transition-colors duration-200",
              // Featured card gets a brighter border to draw the eye
              plan.featured
                ? "bg-[#0E1624] border border-[rgba(255,255,255,0.25)] hover:border-[rgba(255,255,255,0.35)]"
                : "bg-[#0C1220] border border-[rgba(255,255,255,0.07)] hover:border-[rgba(255,255,255,0.15)]",
            ].join(" ")}
          >
            {/* "Most Popular" pill — absolutely positioned above the card's top edge */}
            {plan.featured && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-[#05080F] text-[11px] font-semibold tracking-[0.06em] uppercase px-3 py-1 rounded-full whitespace-nowrap">
                Most Popular
              </span>
            )}

            <p className="font-syne font-bold text-[15px] text-[rgba(255,255,255,0.70)] uppercase tracking-[0.08em] mb-3">
              {plan.name}
            </p>
            <p className="font-syne font-extrabold text-[42px] leading-none tracking-[-0.04em] text-white mb-1.5">
              {plan.price}
            </p>
            <p className="text-[13px] text-[rgba(255,255,255,0.45)] mb-7">
              {plan.cadence}
            </p>

            {/* Divider between price block and feature list */}
            <div className="h-px bg-[rgba(255,255,255,0.07)] mb-6" />

            <ul className="flex flex-col gap-3 mb-8">
              {plan.features.map((feat) => (
                <li key={feat} className="flex items-start gap-2.5 text-[13.5px] text-[rgba(255,255,255,0.70)]">
                  <CheckIcon />
                  {feat}
                </li>
              ))}
            </ul>

            {/* Featured plan uses a solid white CTA; others use a ghost button */}
            <Link
              href="/signup"
              className={[
                "block w-full text-center py-3 rounded-lg text-sm font-medium transition-all duration-200",
                plan.featured
                  ? "bg-white text-[#05080F] border border-white hover:opacity-90"
                  : "bg-transparent text-white border border-[rgba(255,255,255,0.15)] hover:bg-[rgba(255,255,255,0.06)]",
              ].join(" ")}
            >
              Get Started
            </Link>
          </div>
        ))}
      </div>


    </section>
  );
}
