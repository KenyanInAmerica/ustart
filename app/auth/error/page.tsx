// Shown when a magic link is expired, already used, invalid, or the account is deactivated.
// Branches on the `error` query param to surface a tailored message for each failure mode.
// No auth check — this page must be accessible to unauthenticated users.

import Link from "next/link";
import { ContactTriggerLink } from "@/components/ui/ContactTriggerLink";

interface PageProps {
  searchParams: { error?: string };
}

export default function AuthErrorPage({ searchParams }: PageProps) {
  const isDeactivated = searchParams.error === "account_deactivated";

  return (
    <main className="min-h-screen bg-[#05080F] flex items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        {/* Wordmark */}
        <Link
          href="/"
          className="inline-block font-syne font-extrabold text-xl tracking-[-0.03em] text-white mb-12"
        >
          UStart
        </Link>

        {/* Icon — simple envelope with an X */}
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center">
            <svg
              className="w-7 h-7 text-white/40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        {isDeactivated ? (
          <>
            <h1 className="font-syne font-bold text-2xl tracking-[-0.02em] text-white mb-3">
              Account deactivated
            </h1>
            <p className="font-dm-sans text-[15px] text-white/50 leading-relaxed mb-8">
              Your account has been deactivated. If you believe this is a mistake
              or need further assistance, please reach out via our{" "}
              <ContactTriggerLink />.
            </p>

            <Link
              href="/"
              className="inline-flex items-center bg-white text-[#05080F] text-sm font-medium px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
            >
              Back to home
            </Link>
          </>
        ) : (
          <>
            <h1 className="font-syne font-bold text-2xl tracking-[-0.02em] text-white mb-3">
              This link has expired
            </h1>
            <p className="font-dm-sans text-[15px] text-white/50 leading-relaxed mb-8">
              Sign-in links are single-use and expire after a short time. Request a
              new one and you&apos;ll be on your way.
            </p>

            <Link
              href="/sign-in"
              className="inline-flex items-center bg-white text-[#05080F] text-sm font-medium px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
            >
              Request a new link
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
