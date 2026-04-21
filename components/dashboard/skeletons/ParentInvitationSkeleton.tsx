// Skeleton for ParentInvitationSection — mirrors the card with title, body, and input row.

export function ParentInvitationSkeleton() {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
      {/* "Invite a Parent" heading */}
      <div className="mb-4 h-3.5 w-32 rounded bg-[var(--bg-subtle)] animate-pulse" />
      {/* Descriptive body text — 2 lines */}
      <div className="space-y-1.5 mb-4">
        <div className="h-2.5 w-full rounded bg-[var(--bg-subtle)] animate-pulse" />
        <div className="h-2.5 w-3/4 rounded bg-[var(--bg-subtle)] animate-pulse" />
      </div>
      {/* Email input + Send button row */}
      <div className="flex gap-2">
        <div className="h-10 flex-1 rounded-xl bg-[var(--bg-subtle)] animate-pulse" />
        <div className="h-10 w-36 rounded-xl bg-[var(--bg-subtle)] animate-pulse" />
      </div>
    </div>
  );
}
