import { Card } from "@/components/ui/Card";

const features = [
  {
    title: "Content Library",
    desc: "Access curated guides on banking, credit cards, SSN, taxes, and more.",
    icon: (
      <svg
        className="h-9 w-9"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    title: "PDF Resources & Downloads",
    desc: "Download checklists, templates, and step-by-step guides for opening accounts, building credit, and more.",
    icon: (
      <svg
        className="h-9 w-9"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="12" y1="18" x2="12" y2="12" />
        <line x1="9" y1="15" x2="15" y2="15" />
      </svg>
    ),
  },
  {
    title: "Flexible Payment Plans",
    desc: "Multiple lifetime access tiers — pay once and keep your access forever. Subscriptions are available as an add-on for existing members.",
    icon: (
      <svg
        className="h-9 w-9"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
  },
  {
    title: "Parent Pack",
    desc: "An optional add-on that gives a parent their own separate account for access to specialized resources.",
    icon: (
      <svg
        className="h-9 w-9"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    title: "Community Access",
    desc: "Connect with other international students navigating life in the US.",
    icon: (
      <svg
        className="h-9 w-9"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    title: "Account & Billing Portal",
    desc: "Manage your plan and billing details in one place. Recurring add-ons are available inside the dashboard for existing members.",
    icon: (
      <svg
        className="h-9 w-9"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M19.07 4.93l-1.41 1.41M6.34 17.66l-1.41 1.41M2 12h2m16 0h2M6.34 6.34L4.93 4.93m12.73 12.73l1.41 1.41M12 22v-2M12 4V2" />
      </svg>
    ),
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
            key={feature.title}
            className="border border-[var(--border-md)] transition-colors duration-200 hover:bg-[var(--bg-card-hover)]"
            padding="lg"
            shadow="md"
          >
            <div className="mb-5 inline-flex rounded-[var(--radius-md)] bg-[var(--accent)]/10 p-3 text-[var(--accent)]">
              {feature.icon}
            </div>
            <h3 className="mb-2 font-primary text-base font-bold text-[var(--text)]">
              {feature.title}
            </h3>
            <p className="text-[13.5px] leading-[1.6] text-[var(--text-muted)]">
              {feature.desc}
            </p>
          </Card>
        ))}
      </div>
    </section>
  );
}
