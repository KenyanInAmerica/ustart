"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// Loose format check: requires something@something.something.
// Intentionally permissive — accepts international addresses and uncommon TLDs.
// Rejects obvious non-emails like "abcde" that have no @ symbol.
function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

// Map Supabase error messages to user-friendly copy.
// Supabase rate-limit errors come back as "Email rate limit exceeded".
function friendlyError(message: string): string {
  if (message.toLowerCase().includes("rate limit")) {
    return "Too many requests — please wait a moment before trying again.";
  }
  if (message.toLowerCase().includes("invalid email")) {
    return "Please enter a valid email address.";
  }
  return "Something went wrong. Please try again.";
}

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for ?error=auth_failed appended by the callback route on failure
  const urlError =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("error") === "auth_failed";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    // Client-side format check before hitting the network
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // shouldCreateUser: true means new users are registered on first OTP request —
        // no separate signup step needed.
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

  // ── Success state ────────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#05080F] flex flex-col items-center justify-center px-6">
        <Link
          href="/"
          className="font-syne font-extrabold text-xl tracking-[-0.03em] text-white mb-16"
        >
          UStart
        </Link>

        <div className="w-full max-w-[400px] text-center">
          {/* Envelope icon */}
          <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center mx-auto mb-6">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </div>
          <h1 className="font-syne font-bold text-2xl text-white mb-3">
            Check your email
          </h1>
          <p className="text-[15px] text-white/45 leading-relaxed">
            We sent a sign-in link to{" "}
            <span className="text-white/70">{email}</span>. Click it to access
            your account.
          </p>
        </div>
      </div>
    );
  }

  // ── Sign-in form ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#05080F] flex flex-col items-center justify-center px-6">
      {/* Wordmark centered at top — links back to landing page */}
      <Link
        href="/"
        className="font-syne font-extrabold text-xl tracking-[-0.03em] text-white mb-16"
      >
        UStart
      </Link>

      <div className="w-full max-w-[400px]">
        <h1 className="font-syne font-bold text-[28px] tracking-[-0.03em] text-white mb-2">
          Sign in
        </h1>
        <p className="text-[15px] text-white/45 mb-8">
          Enter your email and we&apos;ll send you a sign-in link.
        </p>

        {/* auth_failed error passed from the callback route via query param */}
        {urlError && !error && (
          <p className="text-[13.5px] text-red-400 mb-5" role="alert">
            Sign-in link expired or already used. Please request a new one.
          </p>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <label
            htmlFor="email"
            className="block text-[13px] font-medium text-white/70 mb-2"
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
              // Clear the format error as the user corrects their input
              if (error) setError(null);
            }}
            placeholder="you@university.edu"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-[15px] text-white placeholder:text-white/30 outline-none focus:border-white/30 transition-colors duration-150 mb-3"
          />

          {/* Inline OTP submission error */}
          {error && (
            <p className="text-[13.5px] text-red-400 mb-3" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full bg-white text-[#05080F] font-medium text-[15px] py-3 rounded-lg hover:opacity-90 transition-opacity duration-150 disabled:opacity-40 disabled:cursor-not-allowed mt-2"
          >
            {loading ? "Sending…" : "Send sign-in link"}
          </button>
        </form>
      </div>
    </div>
  );
}
