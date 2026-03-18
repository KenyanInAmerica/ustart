// Client component for the revoke button in the admins table.
// Server-side guard prevents self-revocation; client confirm prompt is UX only.

"use client";

import { useState, useTransition } from "react";
import { revokeAdminAccess } from "@/lib/actions/admin/admins";

interface AdminRevokeButtonProps {
  targetUserId: string;
}

export function AdminRevokeButton({ targetUserId }: AdminRevokeButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleRevoke() {
    if (!confirm("Revoke admin access for this user?")) return;
    setError(null);

    startTransition(async () => {
      const result = await revokeAdminAccess(targetUserId);
      if (!result.success) setError(result.error);
    });
  }

  return (
    <span>
      <button
        onClick={handleRevoke}
        disabled={isPending}
        className="text-[13px] text-white/30 hover:text-red-400 transition-colors disabled:opacity-50"
      >
        {isPending ? "Revoking…" : "Revoke"}
      </button>
      {error && <p className="text-red-400 text-[12px] mt-1 text-right">{error}</p>}
    </span>
  );
}
