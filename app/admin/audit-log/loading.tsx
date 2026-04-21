// Shown by Next.js App Router while the audit log Server Component fetches data.

export default function AuditLogLoading() {
  return (
    <div className="px-8 py-8 max-w-7xl">
      <h1 className="mb-1 font-primary text-2xl font-extrabold tracking-[-0.02em] text-[var(--text)]">
        Audit Log
      </h1>
      <div className="mt-16 flex items-center gap-3 text-[13px] text-[var(--text-muted)]">
        {/* Spinning ring */}
        <svg
          className="h-5 w-5 animate-spin text-[var(--text-muted)]"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
        Loading audit log…
      </div>
    </div>
  );
}
