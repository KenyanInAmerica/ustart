"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Footer } from "@/components/ui/Footer";
import { brand } from "@/lib/config/brand";
import { createClient } from "@/lib/supabase/client";

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function friendlyError(message: string): string {
  if (message.toLowerCase().includes("rate limit")) {
    return "Too many requests — please wait a moment before trying again.";
  }
  if (message.toLowerCase().includes("invalid email")) {
    return "Please enter a valid email address.";
  }
  return "Something went wrong. Please try again.";
}

function EnvelopeIcon() {
  return (
    <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--accent)]">
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </svg>
    </div>
  );
}

function SignInContent() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error") === "auth_failed";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);

    if (otpError) {
      setError(friendlyError(otpError.message));
    } else {
      setSubmitted(true);
    }
  }

  if (submitted) {
    return (
      <Card className="w-full max-w-[440px] border border-[var(--border)] text-center" padding="lg">
        <EnvelopeIcon />
        <h1 className="mb-3 font-primary text-2xl font-bold text-[var(--text)]">
          Check your email
        </h1>
        <p className="text-[15px] leading-relaxed text-[var(--text-muted)]">
          We sent a sign-in link to <span className="text-[var(--text)]">{email}</span>. Click it to access your account.
        </p>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-[440px] border border-[var(--border)]" padding="lg">
      <h1 className="mb-2 font-primary text-[28px] font-bold tracking-[-0.03em] text-[var(--text)]">
        Sign in
      </h1>
      <p className="mb-8 text-[15px] text-[var(--text-muted)]">
        Enter your email and we&apos;ll send you a sign-in link.
      </p>

      {urlError && !error && (
        <p className="mb-5 text-[13.5px] text-[var(--destructive)]" role="alert">
          Sign-in link expired or already used. Please request a new one.
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <label
          htmlFor="email"
          className="mb-2 block text-[13px] font-medium text-[var(--text-mid)]"
        >
          Email address
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError(null);
          }}
          placeholder="you@university.edu"
          className="mb-3 w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-subtle)] px-4 py-3 text-[15px] text-[var(--text)] outline-none transition-colors duration-150 placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]"
        />

        {error && (
          <p className="mb-3 text-[13.5px] text-[var(--destructive)]" role="alert">
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={loading || !email}
          loading={loading}
          className="mt-2 w-full"
        >
          {loading ? "Sending…" : "Send sign-in link"}
        </Button>
      </form>
    </Card>
  );
}

export default function SignInPage() {
  return (
    <>
      <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg)] px-6 py-16">
        <Link
          href="/"
          className="mb-10 font-primary text-2xl font-bold tracking-[-0.03em] text-[var(--accent)]"
        >
          {brand.name}
        </Link>
        <Suspense>
          <SignInContent />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
