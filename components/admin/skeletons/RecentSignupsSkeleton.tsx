// Skeleton for the recent signups table — mirrors the section label,
// table header, and 5 data rows. Column widths approximate Name/Email/Role/University/Joined.

function SkeletonRow({ dim }: { dim?: boolean }) {
  return (
    <div
      className={`flex gap-6 px-4 py-3 ${dim ? "" : "border-b border-[var(--border)]"}`}
    >
      <div className="h-2.5 w-20 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] animate-pulse" />
      <div className="h-2.5 w-32 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] animate-pulse" />
      <div className="h-2.5 w-14 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] animate-pulse" />
      <div className="h-2.5 w-24 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] animate-pulse" />
      <div className="h-2.5 w-20 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] animate-pulse" />
    </div>
  );
}

export function RecentSignupsSkeleton() {
  return (
    <div>
      {/* Section label */}
      <div className="mb-4 h-2.5 w-28 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] animate-pulse" />
      {/* Table */}
      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-white">
        {/* Header row */}
        <div className="border-b border-[var(--border)] bg-white">
          <SkeletonRow />
        </div>
        {/* 5 data rows */}
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonRow key={i} dim={i === 4} />
        ))}
      </div>
    </div>
  );
}
