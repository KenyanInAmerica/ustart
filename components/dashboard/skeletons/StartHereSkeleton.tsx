// Skeleton for the StartHere onboarding card — shown while the section streams in.
// Mirrors the large card with eyebrow, title, description, and 4 step tiles.

export function StartHereSkeleton() {
  return (
    <div className="mb-8 rounded-2xl border border-[var(--border-hi)] bg-[var(--bg-card)] p-8">
      {/* Eyebrow */}
      <div className="mb-3 h-2.5 w-20 rounded bg-[var(--bg-subtle)] animate-pulse" />
      {/* Title */}
      <div className="mb-2 h-5 w-48 rounded bg-[var(--bg-subtle)] animate-pulse" />
      {/* Description */}
      <div className="mb-6 h-3 w-72 rounded bg-[var(--bg-subtle)] animate-pulse" />
      {/* 4 step tiles */}
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg-card-hover)] p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="h-2.5 w-5 rounded bg-[var(--bg-subtle)] animate-pulse" />
              <div className="h-5 w-5 rounded-full bg-[var(--bg-subtle)] animate-pulse" />
            </div>
            <div className="h-2.5 w-full rounded bg-[var(--bg-subtle)] animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
