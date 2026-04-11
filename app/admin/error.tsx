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
      <h2 className="font-syne text-xl font-bold text-white mb-2">
        Something went wrong
      </h2>
      <p className="font-dm-sans text-sm text-white/50 mb-6 max-w-md">
        {error.message || "An unexpected error occurred in the admin panel."}
      </p>
      <button
        onClick={reset}
        className="font-dm-sans text-sm font-medium text-[#05080F] bg-white px-4 py-2 rounded-lg hover:bg-white/90 transition-opacity"
      >
        Try again
      </button>
    </div>
  );
}
