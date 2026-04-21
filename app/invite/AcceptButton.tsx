"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { acceptInvitation } from "@/lib/actions/parentInvitation";

interface AcceptButtonProps {
  token: string;
  parentEmail: string;
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

  if (isSuccess) {
    return (
      <div className="text-center">
        <EnvelopeIcon />
        <h2 className="mb-3 font-primary text-2xl font-bold tracking-[-0.03em] text-[var(--text)]">
          Check your email
        </h2>
        <p className="text-[15px] leading-relaxed text-[var(--text-muted)]">
          We&apos;ve sent a sign-in link to <span className="text-[var(--text)]">{parentEmail}</span>. Click the link in that email to complete setup.
        </p>
      </div>
    );
  }

  return (
    <>
      <EnvelopeIcon />

      <h1 className="mb-3 text-center font-primary text-2xl font-bold tracking-[-0.03em] text-[var(--text)]">
        You&apos;ve been invited to UStart
      </h1>
      <p className="mb-8 text-center text-[15px] leading-relaxed text-[var(--text-muted)]">
        Click below to accept and set up your parent account. You&apos;ll receive a sign-in link to complete the process.
      </p>

      <div className="flex flex-col items-center gap-4">
        <Button
          onClick={handleAccept}
          disabled={isPending}
          className="w-full"
        >
          {isPending ? "Processing…" : "Accept invitation"}
        </Button>

        {error && (
          <p className="text-center text-[13px] text-[var(--destructive)]">{error}</p>
        )}
      </div>
    </>
  );
}
