// Skeleton for the StartHere onboarding card — shown while the section streams in.
// Mirrors the large card with eyebrow, title, description, and 4 step tiles.

export function StartHereSkeleton() {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-bright)] rounded-2xl p-8 mb-8">
      {/* Eyebrow */}
      <div className="h-2.5 w-20 bg-[var(--bg-card-hover)] rounded animate-pulse mb-3" />
      {/* Title */}
      <div className="h-5 w-48 bg-[var(--bg-card-hover)] rounded animate-pulse mb-2" />
      {/* Description */}
      <div className="h-3 w-72 bg-[var(--bg-card-hover)] rounded animate-pulse mb-6" />
      {/* 4 step tiles */}
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-white/[0.03] border border-[var(--border)] rounded-xl p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="h-2.5 w-5 bg-[var(--bg-card-hover)] rounded animate-pulse" />
              <div className="w-5 h-5 rounded-full bg-[var(--bg-card-hover)] animate-pulse" />
            </div>
            <div className="h-2.5 w-full bg-[var(--bg-card-hover)] rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
