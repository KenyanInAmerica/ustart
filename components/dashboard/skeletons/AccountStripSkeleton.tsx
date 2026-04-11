// Skeleton for AccountStrip — mirrors the horizontal card with icon, text, and link.

export function AccountStripSkeleton() {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5 flex items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        {/* Icon placeholder */}
        <div className="w-4 h-4 rounded bg-[var(--bg-card-hover)] animate-pulse mt-0.5 shrink-0" />
        <div>
          {/* "Billing & Subscription" heading */}
          <div className="h-3.5 w-40 bg-[var(--bg-card-hover)] rounded animate-pulse mb-2" />
          {/* Tier + date line */}
          <div className="h-2.5 w-32 bg-[var(--bg-card-hover)] rounded animate-pulse" />
        </div>
      </div>
      {/* "Manage →" link */}
      <div className="h-3 w-16 bg-[var(--bg-card-hover)] rounded animate-pulse shrink-0" />
    </div>
  );
}
