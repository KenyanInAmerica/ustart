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
            className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-white px-5 py-4"
          >
            <div className="mb-2 h-2.5 w-28 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] animate-pulse" />
            <div className="h-8 w-16 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] animate-pulse" />
          </div>
        ))}
      </div>

      {/* Members by tier — section label + 3 tier cards */}
      <div className="mb-10">
        <div className="mb-4 h-2.5 w-28 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] animate-pulse" />
        <div className="flex gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="w-36 rounded-[var(--radius-lg)] border border-[var(--border)] bg-white px-5 py-4"
            >
              <div className="mb-2 h-2.5 w-12 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] animate-pulse" />
              <div className="h-7 w-10 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
