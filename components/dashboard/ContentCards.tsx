import Link from "next/link";
import type { DashboardAccess } from "@/types";

type Props = { access: DashboardAccess };

type CardDef = {
  id: string;
  label: string;
  badge: string;
  description: string;
  href: string;
  unlocked: boolean;
  // CTA shown inside locked cards — links to /pricing.
  lockedCta: string;
  icon: React.ReactNode;
};

// Lock icon used on cards the user cannot yet access.
function LockIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export function ContentCards({ access }: Props) {
  const cards: CardDef[] = [
    {
      id: "lite",
      label: "UStart Lite",
      badge: "Lite",
      description: "Core resources to get started — banking, SSN, credit cards, and student essentials.",
      href: "/dashboard/lite",
      unlocked: access.membershipRank >= 1,
      lockedCta: "View plans →",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      ),
    },
    {
      id: "pro",
      label: "UStart Pro",
      badge: "Pro",
      description: "Everything in Lite plus deeper guides to help you settle in and thrive.",
      href: "/dashboard/pro",
      unlocked: access.membershipRank >= 2,
      lockedCta: "View plans →",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      ),
    },
    {
      id: "premium",
      label: "UStart Premium",
      badge: "Premium",
      description: "Everything in Pro plus our most advanced resources for long-term success in the US.",
      href: "/dashboard/premium",
      unlocked: access.membershipRank >= 3,
      lockedCta: "View plans →",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ),
    },
    {
      id: "parent-pack",
      label: "Parent Pack",
      badge: "Add-on",
      description: "Dedicated resources for parents supporting their student's journey in the US.",
      href: "/dashboard/parent-pack",
      unlocked: access.hasParentSeat,
      lockedCta: "View plans →",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      id: "explore",
      label: "Explore",
      badge: "Add-on",
      description: "School-specific guides, city breakdowns, and living resources updated regularly.",
      href: "/dashboard/explore",
      unlocked: access.hasExplore,
      lockedCta: "View plans →",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
      ),
    },
    {
      id: "concierge",
      label: "Concierge",
      badge: "Add-on",
      description: "1-on-1 sessions with an advisor who knows the US system inside and out.",
      href: "/dashboard/concierge",
      unlocked: access.hasConcierge,
      lockedCta: "View plans →",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      ),
    },
  ];

  // Shared card body content — identical structure for locked and unlocked states.
  function CardBody({ card }: { card: CardDef }) {
    return (
      <>
        {/* Icon + badge row */}
        <div className="flex items-start justify-between mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${card.unlocked ? "bg-white/[0.07] text-white" : "bg-white/[0.03] text-white/[0.28]"}`}>
            {card.unlocked ? card.icon : <LockIcon />}
          </div>
          <span className={`text-[10px] font-bold tracking-[0.1em] uppercase px-[7px] py-[2px] rounded-full border ${card.unlocked ? "text-white/[0.42] bg-white/[0.04] border-white/[0.07]" : "text-white/[0.28] bg-white/[0.02] border-white/[0.05]"}`}>
            {card.badge}
          </span>
        </div>

        {/* Title + description */}
        <p className={`font-syne text-sm font-bold mb-1 ${card.unlocked ? "text-white" : "text-white/[0.28]"}`}>
          {card.label}
        </p>
        <p className={`font-dm-sans text-xs leading-relaxed mb-4 ${card.unlocked ? "text-white/[0.42]" : "text-white/[0.20]"}`}>
          {card.description}
        </p>

        {/* CTA */}
        {card.unlocked ? (
          <span className="text-xs font-medium text-white/[0.42]">Access content →</span>
        ) : (
          // Locked cards show an inner link to /pricing; the card wrapper itself is not a link.
          <Link
            href="/pricing"
            className="text-xs text-white/[0.28] hover:text-white/[0.42] transition-colors"
          >
            {card.lockedCta}
          </Link>
        )}
      </>
    );
  }

  return (
    // 3-column grid on desktop, 2 on tablet, 1 on mobile
    <div className="grid grid-cols-1 min-[560px]:grid-cols-2 min-[860px]:grid-cols-3 gap-3">
      {cards.map((card) =>
        card.unlocked ? (
          // Entire card is a link for unlocked content
          <Link
            key={card.id}
            href={card.href}
            className="block bg-[#0C1220] border border-white/[0.07] rounded-2xl p-5 hover:border-white/[0.14] hover:bg-white/[0.02] transition-colors duration-150"
          >
            <CardBody card={card} />
          </Link>
        ) : (
          // Locked cards are non-interactive divs — the pricing CTA inside is the only link
          <div
            key={card.id}
            className="bg-[#0C1220] border border-white/[0.05] rounded-2xl p-5"
          >
            <CardBody card={card} />
          </div>
        )
      )}
    </div>
  );
}
