"use client";

// Client component that owns the full card body content on the /invite page.
// Renders the invitation view by default; on success replaces everything with
// "Check your email" so the parent is never left looking at stale invite content.

import { useState } from "react";
import { acceptInvitation } from "@/lib/actions/parentInvitation";

interface AcceptButtonProps {
  token: string;
  // Shown in the success message so the parent knows which inbox to check.
  parentEmail: string;
}

// Shared envelope SVG used in both invitation and success views.
function EnvelopeIcon() {
  return (
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
  );
}

export function AcceptButton({ token, parentEmail }: AcceptButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleAccept() {
    setError(null);
    setIsPending(true);
    const result = await acceptInvitation(token);
    setIsPending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setIsSuccess(true);
  }

  // Success: replace the entire card body — invitation content is no longer relevant.
  if (isSuccess) {
    return (
      <div className="text-center">
        <EnvelopeIcon />
        <h2 className="font-syne font-bold text-2xl tracking-[-0.03em] text-white mb-3">
          Check your email
        </h2>
        <p className="text-[15px] text-white/45 leading-relaxed">
          We&apos;ve sent a sign-in link to{" "}
          <span className="text-white/70">{parentEmail}</span>. Click the link
          in that email to complete setup.
        </p>
      </div>
    );
  }

  // Default: invitation view with the Accept button.
  return (
    <>
      <EnvelopeIcon />

      <h1 className="font-syne font-bold text-2xl tracking-[-0.03em] text-white mb-3 text-center">
        You&apos;ve been invited to UStart
      </h1>
      <p className="text-[15px] text-white/45 leading-relaxed text-center mb-8">
        Click below to accept and set up your parent account. You&apos;ll
        receive a sign-in link to complete the process.
      </p>

      <div className="flex flex-col items-center gap-4">
        <button
          onClick={handleAccept}
          disabled={isPending}
          className="w-full bg-white text-[#05080F] font-dm-sans font-semibold text-[15px] tracking-[-0.01em] py-[14px] px-9 rounded-lg transition-opacity disabled:opacity-60"
        >
          {isPending ? "Processing…" : "Accept invitation"}
        </button>

        {/* Inline error — only shown when acceptInvitation returns a failure */}
        {error && (
          <p className="text-[13px] text-red-400 text-center">{error}</p>
        )}
      </div>
    </>
  );
}
