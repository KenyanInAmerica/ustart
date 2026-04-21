import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { ContactTriggerLink } from "@/components/ui/ContactTriggerLink";
import { brand } from "@/lib/config/brand";

interface PageProps {
  searchParams: { error?: string };
}

function ErrorIcon() {
  return (
    <div className="mb-6 flex justify-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--destructive)]">
        <svg
          className="h-7 w-7"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="M3 8l7.89 5.26a2 2 0 0 0 2.22 0L21 8M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z" />
        </svg>
      </div>
    </div>
  );
}

export default function AuthErrorPage({ searchParams }: PageProps) {
  const isDeactivated = searchParams.error === "account_deactivated";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-6 py-16">
      <div className="w-full max-w-md text-center">
        <Link
          href="/"
          className="mb-12 inline-block font-primary text-2xl font-bold tracking-[-0.03em] text-[var(--accent)]"
        >
          {brand.name}
        </Link>

        <Card className="border border-[var(--border)]" padding="lg">
          <ErrorIcon />

          {isDeactivated ? (
            <>
              <h1 className="mb-3 font-primary text-2xl font-bold tracking-[-0.02em] text-[var(--text)]">
                Account deactivated
              </h1>
              <p className="mb-8 font-primary text-[15px] leading-relaxed text-[var(--text-muted)]">
                Your account has been deactivated. If you believe this is a mistake or need further assistance, please reach out via our{" "}
                <ContactTriggerLink />.
              </p>

              <Link
                href="/"
                className="inline-flex w-full items-center justify-center rounded-[var(--radius-sm)] bg-[var(--accent)] px-4 py-2.5 font-primary text-sm font-semibold text-white transition-colors duration-200 hover:bg-[var(--accent-hover)]"
              >
                Back to home
              </Link>
            </>
          ) : (
            <>
              <h1 className="mb-3 font-primary text-2xl font-bold tracking-[-0.02em] text-[var(--text)]">
                This link has expired
              </h1>
              <p className="mb-8 font-primary text-[15px] leading-relaxed text-[var(--text-muted)]">
                Sign-in links are single-use and expire after a short time. Request a new one and you&apos;ll be on your way.
              </p>

              <Link
                href="/sign-in"
                className="inline-flex w-full items-center justify-center rounded-[var(--radius-sm)] bg-[var(--accent)] px-4 py-2.5 font-primary text-sm font-semibold text-white transition-colors duration-200 hover:bg-[var(--accent-hover)]"
              >
                Request a new link
              </Link>
            </>
          )}
        </Card>
      </div>
    </main>
  );
}
