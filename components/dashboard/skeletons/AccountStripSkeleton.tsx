// Skeleton for AccountStrip — mirrors the horizontal card with icon, text, and link.

export function AccountStripSkeleton() {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
      <div className="flex items-start gap-3">
        {/* Icon placeholder */}
        <div className="mt-0.5 h-4 w-4 shrink-0 rounded bg-[var(--bg-subtle)] animate-pulse" />
        <div>
          {/* "Billing & Subscription" heading */}
          <div className="mb-2 h-3.5 w-40 rounded bg-[var(--bg-subtle)] animate-pulse" />
          {/* Tier + date line */}
          <div className="h-2.5 w-32 rounded bg-[var(--bg-subtle)] animate-pulse" />
        </div>
      </div>
      {/* "Manage →" link */}
      <div className="h-3 w-16 shrink-0 rounded bg-[var(--bg-subtle)] animate-pulse" />
    </div>
  );
}
