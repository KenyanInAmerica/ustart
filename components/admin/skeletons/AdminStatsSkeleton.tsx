// Skeleton for the admin stats section — mirrors the 9 stat cards grid
// and the 3 members-by-tier cards below it.

export function AdminStatsSkeleton() {
  return (
    <>
      {/* 9 stat cards — 3-col grid */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-5 py-4"
          >
            <div className="h-2.5 w-28 bg-[var(--bg-card-hover)] rounded animate-pulse mb-2" />
            <div className="h-8 w-16 bg-[var(--bg-card-hover)] rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Members by tier — section label + 3 tier cards */}
      <div className="mb-10">
        <div className="h-2.5 w-28 bg-[var(--bg-card-hover)] rounded animate-pulse mb-4" />
        <div className="flex gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-5 py-4 w-36"
            >
              <div className="h-2.5 w-12 bg-[var(--bg-card-hover)] rounded animate-pulse mb-2" />
              <div className="h-7 w-10 bg-[var(--bg-card-hover)] rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
