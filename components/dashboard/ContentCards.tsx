// Content section cards for the dashboard — one card per product the user may access.
// Locked tier cards link to /pricing; locked add-on cards open a purchase modal.
// Client Component: needed for the add-on modal open/close state.

"use client";

import { useState } from "react";
import Link from "next/link";
import { AddonModal } from "@/components/dashboard/AddonModal";
import { Card } from "@/components/ui/Card";
import { accentIconClass, accentSurfaceClass, type ProductAccent } from "@/lib/config/productAccents";
import type { DashboardAccess } from "@/types";
import type { PricingItem, ProductId } from "@/lib/config/pricing";

type Props = {
  access: DashboardAccess;
  upsellPricing: Partial<Record<ProductId, PricingItem>>;
};

type CardDef = {
  id: string;
  label: string;
  badge: string;
  description: string;
  href: string;
  unlocked: boolean;
  accent: ProductAccent;
  icon: React.ReactNode;
};

function opensModal(id: string): id is "parent_pack" {
  return id === "parent_pack";
}

function LockIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function CardBody({ card }: { card: CardDef }) {
  return (
    <>
      <div className="mb-4 flex items-start justify-between">
        <div
          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
            card.unlocked ? accentIconClass(card.accent) : "bg-[var(--bg-subtle)] text-[var(--text-muted)]"
          }`}
        >
          {card.unlocked ? card.icon : <span className="opacity-40"><LockIcon /></span>}
        </div>
        <span
          className={`rounded-full px-[7px] py-[2px] text-[10px] font-bold uppercase tracking-[0.1em] ${
            card.unlocked
              ? accentSurfaceClass(card.accent)
              : "border border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--text-muted)]"
          }`}
        >
          {card.badge}
        </span>
      </div>

      <p className={`mb-1 font-primary text-sm font-semibold ${card.unlocked ? "text-[var(--text)]" : "text-[var(--text-muted)]"}`}>
        {card.label}
      </p>
      <p className="mb-4 font-primary text-xs leading-relaxed text-[var(--text-muted)]">
        {card.description}
      </p>

      {card.unlocked ? (
        <span className="inline-flex items-center justify-center rounded-[var(--radius-sm)] bg-[var(--accent)] px-3.5 py-2 text-sm font-semibold text-white">
          Open section
        </span>
      ) : (
        <span className="inline-flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <span className="opacity-40">
            <LockIcon />
          </span>
          Locked
        </span>
      )}
    </>
  );
}

export function ContentCards({ access, upsellPricing }: Props) {
  const [openAddon, setOpenAddon] = useState<"parent_pack" | null>(null);

  const cards: CardDef[] = [
    {
      id: "lite",
      label: "UStart Lite",
      badge: "Lite",
      description: "Core resources to get started — banking, SSN, credit cards, and student essentials.",
      href: "/dashboard/lite",
      unlocked: access.membershipRank >= 1,
      accent: "lite",
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      ),
    },
    {
      id: "explore",
      label: "UStart Explore",
      badge: "Explore",
      description: "Everything in Lite plus deeper guides to help you settle in and thrive.",
      href: "/dashboard/explore",
      unlocked: access.membershipRank >= 2,
      accent: "explore",
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      ),
    },
    {
      id: "concierge",
      label: "UStart Concierge",
      badge: "Concierge",
      description: "Everything in Explore plus our most advanced resources for long-term success in the US.",
      href: "/dashboard/concierge",
      unlocked: access.membershipRank >= 3,
      accent: "concierge",
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ),
    },
    {
      id: "parent_pack",
      label: "Parent Pack",
      badge: "Add-on",
      description: "Dedicated resources for parents supporting their student's journey in the US.",
      href: "/dashboard/parent-pack",
      unlocked: access.hasParentSeat,
      accent: "parent_pack",
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
  ];

  return (
    <>
      <div className="grid grid-cols-1 gap-3 min-[560px]:grid-cols-2 min-[860px]:grid-cols-3">
        {cards.map((card) => {
          if (card.unlocked) {
            return (
              <Link
                key={card.id}
                href={card.href}
                className="block transition-transform duration-150 hover:-translate-y-px"
              >
                <Card
                  className="h-full border border-[var(--border-md)] shadow-[var(--shadow-md)] transition-all duration-200 hover:border-[var(--border-hi)] hover:shadow-[var(--shadow-lg)]"
                  padding="md"
                >
                  <CardBody card={card} />
                </Card>
              </Link>
            );
          }

          if (opensModal(card.id)) {
            return (
              <button
                key={card.id}
                onClick={() => setOpenAddon("parent_pack")}
                className="w-full text-left transition-transform duration-150 hover:-translate-y-px"
              >
                <Card className="h-full border border-[var(--border)] bg-[var(--bg-subtle)] shadow-none" padding="md">
                  <CardBody card={card} />
                </Card>
              </button>
            );
          }

          return (
            <Link
              key={card.id}
              href="/pricing"
              className="block transition-transform duration-150 hover:-translate-y-px"
            >
              <Card className="h-full border border-[var(--border)] bg-[var(--bg-subtle)] shadow-none" padding="md">
                <CardBody card={card} />
              </Card>
            </Link>
          );
        })}
      </div>

      {openAddon && upsellPricing[openAddon] && (
        <AddonModal
          item={upsellPricing[openAddon]!}
          onClose={() => setOpenAddon(null)}
        />
      )}
    </>
  );
}
