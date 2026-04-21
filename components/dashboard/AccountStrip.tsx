import Link from "next/link";
import type { DashboardAccess } from "@/types";

type Props = {
  access: DashboardAccess;
};

const TIER_DISPLAY: Record<string, string> = {
  lite: "UStart Lite",
  explore: "UStart Explore",
  concierge: "UStart Concierge",
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
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--border)] border-l-4 border-l-[#F5C842] bg-white p-5">
      <div className="flex items-start gap-3">
        {/* Credit card / billing icon */}
        <svg
          className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-700"
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
          <p className="mb-1 font-primary text-sm font-bold text-[var(--text)]">
            Billing &amp; Subscription
          </p>
          {access.hasMembership && tierName ? (
            <p className="font-primary text-xs text-[var(--text-muted)]">
              {tierName}
              {access.membershipPurchasedAt
                ? ` · purchased ${formatPurchaseDate(access.membershipPurchasedAt)}`
                : ""}
            </p>
          ) : (
            // No plan — link straight to pricing so there's a clear next action.
            <Link
              href="/pricing"
              className="font-primary text-xs text-[var(--text-muted)] underline transition-colors hover:text-[var(--text)]"
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
          className="flex-shrink-0 inline-flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border-md)] bg-white px-3.5 py-2 text-sm font-semibold text-[var(--text)] transition-colors duration-200 hover:bg-[var(--bg-subtle)]"
        >
          Manage
        </Link>
      )}
    </div>
  );
}
