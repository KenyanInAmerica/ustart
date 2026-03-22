// Client component for the revoke button in the admins table.
// Inline two-step confirmation replaces the browser confirm() dialog so the
// UI stays consistent with the rest of the admin panel.

"use client";

import { useState, useTransition } from "react";
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
        // Inline confirm prompt — avoids browser dialog dependency
        <span className="inline-flex items-center gap-2">
          <span className="text-[12px] text-white/50">Revoke access?</span>
          <button
            onClick={handleRevoke}
            disabled={isPending}
            className="text-[12px] text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
          >
            {isPending ? "Revoking…" : "Yes"}
          </button>
          <button
            onClick={() => setConfirming(false)}
            disabled={isPending}
            className="text-[12px] text-white/30 hover:text-white transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </span>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className="text-[13px] text-white/30 hover:text-red-400 transition-colors"
        >
          Revoke
        </button>
      )}
      {error && <p className="text-red-400 text-[12px]">{error}</p>}
    </span>
  );
}
