// Skeleton for CommunitySection — mirrors the single card with title, body, and CTA.

export function CommunitySectionSkeleton() {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5">
      {/* Title */}
      <div className="h-3.5 w-24 bg-[var(--bg-card-hover)] rounded animate-pulse mb-3" />
      {/* Body text — 2 lines */}
      <div className="space-y-1.5 mb-4">
        <div className="h-2.5 w-full bg-[var(--bg-card-hover)] rounded animate-pulse" />
        <div className="h-2.5 w-4/5 bg-[var(--bg-card-hover)] rounded animate-pulse" />
      </div>
      {/* CTA button placeholder */}
      <div className="h-9 w-40 bg-[var(--bg-card-hover)] rounded-xl animate-pulse" />
    </div>
  );
}
