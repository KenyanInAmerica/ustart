// Skeleton for the ContentCards grid — shown while the section streams in.
// 6 cards in the same 1/2/3-col responsive grid as the real component.

function SkeletonCard() {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5">
      {/* Icon + badge row */}
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-[var(--bg-card-hover)] animate-pulse" />
        <div className="h-4 w-14 rounded-full bg-[var(--bg-card-hover)] animate-pulse" />
      </div>
      {/* Title */}
      <div className="h-3.5 w-28 bg-[var(--bg-card-hover)] rounded animate-pulse mb-2" />
      {/* Description — 3 lines */}
      <div className="space-y-1.5 mb-4">
        <div className="h-2.5 w-full bg-[var(--bg-card-hover)] rounded animate-pulse" />
        <div className="h-2.5 w-4/5 bg-[var(--bg-card-hover)] rounded animate-pulse" />
        <div className="h-2.5 w-3/5 bg-[var(--bg-card-hover)] rounded animate-pulse" />
      </div>
      {/* CTA text */}
      <div className="h-2.5 w-24 bg-[var(--bg-card-hover)] rounded animate-pulse" />
    </div>
  );
}

export function ContentCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 min-[560px]:grid-cols-2 min-[860px]:grid-cols-3 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
