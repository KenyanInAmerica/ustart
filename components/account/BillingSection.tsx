"use client";

import { useState } from "react";
import Link from "next/link";

import { AddonModal } from "@/components/dashboard/AddonModal";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
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
  hasParentSeat: boolean;
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
  const [openAddon, setOpenAddon] = useState<PricingItem | null>(null);

  const hasMembership = membershipTier !== null;
  const tierName = membershipTier
    ? (TIER_DISPLAY[membershipTier] ?? membershipTier)
    : null;

  const allAddons = [
    ...(hasParentSeat
      ? [{ type: "parent_pack", label: "Parent Pack", status: "active" }]
      : []),
    ...activeAddons.map((addon) => ({
      type: addon.type,
      label: ADDON_DISPLAY[addon.type] ?? addon.type,
      status: addon.status,
    })),
  ];

  const ownedAddonTypes = new Set([
    ...(hasParentSeat ? ["parent_pack"] : []),
    ...activeAddons.map((addon) => addon.type),
  ]);
  const availableAddons = addonPricing.filter(
    (addon) => !ownedAddonTypes.has(addon.id)
  );

  return (
    <section>
      <h2 className="mb-4 font-primary text-[13px] font-bold uppercase tracking-[0.06em] text-[var(--text)]">
        Billing
      </h2>

      <Card className="mb-3 border border-[var(--border)]" padding="md">
        <p className="mb-3 font-primary text-sm font-bold text-[var(--text)]">
          Current plan
        </p>
        {hasMembership && tierName ? (
          <div>
            <p className="mb-3 font-primary text-sm text-[var(--text-muted)]">
              {tierName}
              {membershipPurchasedAt
                ? ` · purchased ${formatDate(membershipPurchasedAt)}`
                : ""}
            </p>
            {membershipTier !== "premium" && (
              <Link
                href="/pricing"
                className="font-primary text-sm font-medium text-[var(--accent)] transition-colors hover:underline"
              >
                Upgrade your plan
              </Link>
            )}
          </div>
        ) : (
          <div>
            <p className="mb-3 font-primary text-sm text-[var(--text-muted)]">
              No active plan
            </p>
            <Link
              href="/pricing"
              className="font-primary text-sm font-medium text-[var(--accent)] transition-colors hover:underline"
            >
              View plans
            </Link>
          </div>
        )}
      </Card>

      <Card className="mb-3 border border-[var(--border)]" padding="md">
        <p className="mb-3 font-primary text-sm font-bold text-[var(--text)]">
          Active add-ons
        </p>
        {allAddons.length === 0 ? (
          <p className="font-primary text-sm text-[var(--text-muted)]">
            No active add-ons
          </p>
        ) : (
          <ul className="space-y-2">
            {allAddons.map((addon) => (
              <li key={addon.type} className="flex items-center justify-between gap-3">
                <span className="font-primary text-sm text-[var(--text)]">
                  {addon.label}
                </span>
                <span className="font-primary text-xs capitalize text-[var(--text-muted)]">
                  {addon.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {availableAddons.length > 0 && (
        <Card className="mb-3 border border-[var(--border)]" padding="md">
          <p className="mb-3 font-primary text-sm font-bold text-[var(--text)]">
            Available add-ons
          </p>
          <ul className="space-y-3">
            {availableAddons.map((addon) => (
              <li key={addon.id} className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-primary text-sm text-[var(--text)]">{addon.name}</p>
                  <p className="mt-0.5 font-primary text-xs text-[var(--text-muted)]">
                    ${addon.price}
                    {addon.billing === "monthly"
                      ? "/mo"
                      : addon.billing === "yearly"
                        ? "/yr"
                        : " · lifetime"}
                  </p>
                </div>
                <Button onClick={() => setOpenAddon(addon)} size="sm">
                  Buy Now
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="mb-3 border border-[var(--border)]" padding="md">
        <p className="font-primary text-sm text-[var(--text-muted)]">
          Payment method — available when billing is connected
        </p>
      </Card>

      <Card className="border border-[var(--border)]" padding="md">
        <p className="font-primary text-sm text-[var(--text-muted)]">
          Invoices — available when billing is connected
        </p>
      </Card>

      {openAddon && (
        <AddonModal item={openAddon} onClose={() => setOpenAddon(null)} />
      )}
    </section>
  );
}
