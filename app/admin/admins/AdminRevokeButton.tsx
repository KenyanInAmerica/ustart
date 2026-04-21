"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { revokeAdminAccess } from "@/lib/actions/admin/admins";

interface AdminRevokeButtonProps {
  targetUserId: string;
}

export function AdminRevokeButton({ targetUserId }: AdminRevokeButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleRevoke() {
    setError(null);
    startTransition(async () => {
      const result = await revokeAdminAccess(targetUserId);
      if (!result.success) {
        setError(result.error);
      }
      setConfirming(false);
    });
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      {confirming ? (
        <span className="inline-flex items-center gap-2">
          <span className="text-[12px] text-[var(--text-muted)]">Revoke access?</span>
          <Button onClick={handleRevoke} disabled={isPending} variant="destructive" size="sm">
            {isPending ? "Revoking…" : "Yes"}
          </Button>
          <Button onClick={() => setConfirming(false)} disabled={isPending} variant="secondary" size="sm">
            Cancel
          </Button>
        </span>
      ) : (
        <Button onClick={() => setConfirming(true)} variant="destructive" size="sm">
          Revoke
        </Button>
      )}
      {error && <p className="text-[12px] text-[var(--destructive)]">{error}</p>}
    </span>
  );
}
