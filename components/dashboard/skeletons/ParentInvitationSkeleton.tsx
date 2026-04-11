// Skeleton for ParentInvitationSection — mirrors the card with title, body, and input row.

export function ParentInvitationSkeleton() {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5">
      {/* "Invite a Parent" heading */}
      <div className="h-3.5 w-32 bg-[var(--bg-card-hover)] rounded animate-pulse mb-4" />
      {/* Descriptive body text — 2 lines */}
      <div className="space-y-1.5 mb-4">
        <div className="h-2.5 w-full bg-[var(--bg-card-hover)] rounded animate-pulse" />
        <div className="h-2.5 w-3/4 bg-[var(--bg-card-hover)] rounded animate-pulse" />
      </div>
      {/* Email input + Send button row */}
      <div className="flex gap-2">
        <div className="flex-1 h-10 bg-[var(--bg-card-hover)] rounded-xl animate-pulse" />
        <div className="h-10 w-36 bg-[var(--bg-card-hover)] rounded-xl animate-pulse" />
      </div>
    </div>
  );
}
