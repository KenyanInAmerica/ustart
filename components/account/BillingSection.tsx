// Billing section for the account page — displays the current plan, active add-ons,
// available add-ons with purchase CTAs, and placeholder rows for payment/invoices.
// Client Component: needed for the add-on purchase modal state.

"use client";

import { useState } from "react";
import Link from "next/link";
import { AddonModal } from "@/components/dashboard/AddonModal";
import type { PricingItem } from "@/lib/config/pricing";

interface ActiveAddon {
  type: string;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

interface Props {
  membershipTier: string | null;
  membershipPurchasedAt: string | null;
  activeAddons: ActiveAddon[];
  // Parent Pack comes from one_time_purchases, not the addons table — passed as a flag.
  hasParentSeat: boolean;
  // Pre-fetched pricing for add-ons — passed from the server component parent.
  addonPricing: PricingItem[];
}

const TIER_DISPLAY: Record<string, string> = {
  lite: "UStart Lite",
  pro: "UStart Pro",
  premium: "UStart Premium",
};

const ADDON_DISPLAY: Record<string, string> = {
  parent_seat: "Parent Pack",
  parent_pack: "Parent Pack",
  explore: "Explore",
  concierge: "Concierge",
};

// Formats an ISO timestamp as "Jan 12, 2026" in UTC.
function formatDate(isoString: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(isoString));
}

export function BillingSection({
  membershipTier,
  membershipPurchasedAt,
  activeAddons,
  hasParentSeat,
  addonPricing,
}: Props) {
  // Which add-on purchase modal is open. Null when none.
  const [openAddon, setOpenAddon] = useState<PricingItem | null>(null);

  const hasMembership = membershipTier !== null;
  const tierName = membershipTier
    ? (TIER_DISPLAY[membershipTier] ?? membershipTier)
    : null;

  // Merge Parent Pack (one_time_purchases) with subscription add-ons for display.
  // Parent Pack is a lifetime purchase, so it has no status or period — show "active".
  const allAddons = [
    ...(hasParentSeat ? [{ type: "parent_pack", label: "Parent Pack", status: "active" }] : []),
    ...activeAddons.map((a) => ({
      type: a.type,
      label: ADDON_DISPLAY[a.type] ?? a.type,
      status: a.status,
    })),
  ];

  // Determine which add-ons the user does NOT yet have, to show as purchasable.
  const ownedAddonTypes = new Set([
    ...(hasParentSeat ? ["parent_pack"] : []),
    ...activeAddons.map((a) => a.type),
  ]);
  const availableAddons = addonPricing.filter(
    (p) => !ownedAddonTypes.has(p.id)
  );

  return (
    <section>
      <h2 className="font-syne text-[13px] font-bold tracking-[0.06em] uppercase text-white/[0.42] mb-4">
        Billing
      </h2>

      {/* Current plan */}
      <div className="bg-[#0C1220] border border-white/[0.07] rounded-2xl p-5 mb-3">
        <p className="font-syne text-sm font-bold text-white mb-3">Current plan</p>
        {hasMembership && tierName ? (
          <div>
            <p className="font-dm-sans text-sm text-white/[0.68] mb-3">
              {tierName}
              {membershipPurchasedAt
                ? ` · purchased ${formatDate(membershipPurchasedAt)}`
                : ""}
            </p>
            {/* Users not on Premium always see an upgrade prompt. */}
            {membershipTier !== "premium" && (
              <Link
                href="/pricing"
                className="font-dm-sans text-xs text-white/[0.42] hover:text-white/[0.70] underline transition-colors"
              >
                Upgrade your plan →
              </Link>
            )}
          </div>
        ) : (
          <div>
            <p className="font-dm-sans text-sm text-white/[0.42] mb-3">No active plan</p>
            <Link
              href="/pricing"
              className="font-dm-sans text-xs text-white/[0.42] hover:text-white/[0.70] underline transition-colors"
            >
              View plans →
            </Link>
          </div>
        )}
      </div>

      {/* Active add-ons */}
      <div className="bg-[#0C1220] border border-white/[0.07] rounded-2xl p-5 mb-3">
        <p className="font-syne text-sm font-bold text-white mb-3">Active add-ons</p>
        {allAddons.length === 0 ? (
          <p className="font-dm-sans text-sm text-white/[0.42]">No active add-ons</p>
        ) : (
          <ul className="space-y-2">
            {allAddons.map((addon) => (
              <li key={addon.type} className="flex items-center justify-between">
                <span className="font-dm-sans text-sm text-white/[0.68]">
                  {addon.label}
                </span>
                <span className="font-dm-sans text-xs text-white/[0.42] capitalize">
                  {addon.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Available add-ons — shown when the user is missing at least one add-on */}
      {availableAddons.length > 0 && (
        <div className="bg-[#0C1220] border border-white/[0.07] rounded-2xl p-5 mb-3">
          <p className="font-syne text-sm font-bold text-white mb-3">
            Available add-ons
          </p>
          <ul className="space-y-3">
            {availableAddons.map((addon) => (
              <li key={addon.id} className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-dm-sans text-sm text-white/[0.68]">{addon.name}</p>
                  <p className="font-dm-sans text-xs text-white/[0.40] mt-0.5">
                    ${addon.price}
                    {addon.billing === "monthly"
                      ? "/mo"
                      : addon.billing === "yearly"
                      ? "/yr"
                      : " · lifetime"}
                  </p>
                </div>
                <button
                  onClick={() => setOpenAddon(addon)}
                  className="shrink-0 text-xs font-medium text-white/50 hover:text-white border border-white/[0.10] hover:border-white/30 px-3 py-1.5 rounded-lg transition-colors"
                >
                  {/* TODO: replace with Stripe checkout session redirect (Feature 12) */}
                  Buy Now
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Placeholder rows — billing integration not yet connected. */}
      <div className="bg-[#0C1220] border border-white/[0.07] rounded-2xl p-5 mb-3">
        <p className="font-dm-sans text-sm text-white/[0.28]">
          Payment method — available when billing is connected
        </p>
      </div>

      <div className="bg-[#0C1220] border border-white/[0.07] rounded-2xl p-5">
        <p className="font-dm-sans text-sm text-white/[0.28]">
          Invoices — available when billing is connected
        </p>
      </div>

      {/* Add-on purchase modal */}
      {openAddon && (
        <AddonModal item={openAddon} onClose={() => setOpenAddon(null)} />
      )}
    </section>
  );
}
