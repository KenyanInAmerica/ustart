// Skeleton for CommunitySection — mirrors the single card with title, body, and CTA.

export function CommunitySectionSkeleton() {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
      {/* Title */}
      <div className="mb-3 h-3.5 w-24 rounded bg-[var(--bg-subtle)] animate-pulse" />
      {/* Body text — 2 lines */}
      <div className="space-y-1.5 mb-4">
        <div className="h-2.5 w-full rounded bg-[var(--bg-subtle)] animate-pulse" />
        <div className="h-2.5 w-4/5 rounded bg-[var(--bg-subtle)] animate-pulse" />
      </div>
      {/* CTA button placeholder */}
      <div className="h-9 w-40 rounded-xl bg-[var(--bg-subtle)] animate-pulse" />
    </div>
  );
}
