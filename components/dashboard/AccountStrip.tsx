import Link from "next/link";
import type { DashboardAccess } from "@/types";

type Props = {
  access: DashboardAccess;
};

const TIER_DISPLAY: Record<string, string> = {
  lite: "UStart Lite",
  pro: "UStart Pro",
  premium: "UStart Premium",
};

// Formats an ISO timestamp as "Jan 12, 2026" in UTC to avoid timezone-driven date shifts.
function formatPurchaseDate(isoString: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(isoString));
}

export function AccountStrip({ access }: Props) {
  const tierName = access.membershipTier
    ? (TIER_DISPLAY[access.membershipTier] ?? access.membershipTier)
    : null;

  return (
    <div className="bg-[#0C1220] border border-white/[0.07] rounded-2xl p-5 flex items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        {/* Credit card / billing icon */}
        <svg
          className="w-4 h-4 text-white/[0.42] flex-shrink-0 mt-0.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
          <line x1="1" y1="10" x2="23" y2="10" />
        </svg>

        <div>
          <p className="font-syne text-sm font-bold text-white mb-1">
            Billing &amp; Subscription
          </p>
          {access.hasMembership && tierName ? (
            <p className="font-dm-sans text-xs text-white/[0.42]">
              {tierName}
              {access.membershipPurchasedAt
                ? ` · purchased ${formatPurchaseDate(access.membershipPurchasedAt)}`
                : ""}
            </p>
          ) : (
            // No plan — link straight to pricing so there's a clear next action.
            <Link
              href="/pricing"
              className="font-dm-sans text-xs text-white/[0.42] hover:text-white/[0.70] underline transition-colors"
            >
              No active plan — view plans →
            </Link>
          )}
        </div>
      </div>

      {/* Only show Manage link when the user has an active plan. */}
      {access.hasMembership && (
        <Link
          href="/dashboard/account"
          className="font-dm-sans text-sm text-white/[0.68] hover:text-white transition-colors flex-shrink-0"
        >
          Manage →
        </Link>
      )}
    </div>
  );
}
