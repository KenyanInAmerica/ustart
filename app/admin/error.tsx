"use client";

// Route-level error boundary for /admin/* — catches unrecovered errors that
// bubble past the section-level SectionErrorBoundary components.
// Next.js requires this to be a Client Component with the (error, reset) signature.

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-8 text-center">
      <h2 className="mb-2 font-primary text-xl font-bold text-[var(--text)]">
        Something went wrong
      </h2>
      <p className="mb-6 max-w-md font-primary text-sm text-[var(--text-muted)]">
        {error.message || "An unexpected error occurred in the admin panel."}
      </p>
      <button
        onClick={reset}
        className="rounded-[var(--radius-sm)] bg-[var(--accent)] px-4 py-2 font-primary text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)]"
      >
        Try again
      </button>
    </div>
  );
}
