// Skeleton for the recent signups table — mirrors the section label,
// table header, and 5 data rows. Column widths approximate Name/Email/Role/University/Joined.

function SkeletonRow({ dim }: { dim?: boolean }) {
  return (
    <div
      className={`flex gap-6 px-4 py-3 ${dim ? "" : "border-b border-[var(--border)]"}`}
    >
      <div className="h-2.5 w-20 bg-[var(--bg-card-hover)] rounded animate-pulse" />
      <div className="h-2.5 w-32 bg-[var(--bg-card-hover)] rounded animate-pulse" />
      <div className="h-2.5 w-14 bg-[var(--bg-card-hover)] rounded animate-pulse" />
      <div className="h-2.5 w-24 bg-[var(--bg-card-hover)] rounded animate-pulse" />
      <div className="h-2.5 w-20 bg-[var(--bg-card-hover)] rounded animate-pulse" />
    </div>
  );
}

export function RecentSignupsSkeleton() {
  return (
    <div>
      {/* Section label */}
      <div className="h-2.5 w-28 bg-[var(--bg-card-hover)] rounded animate-pulse mb-4" />
      {/* Table */}
      <div className="border border-[var(--border)] rounded-xl overflow-hidden">
        {/* Header row */}
        <div className="bg-[var(--bg-card)] border-b border-[var(--border)]">
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
