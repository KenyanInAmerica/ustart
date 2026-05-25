"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { grantAdminAccess } from "@/lib/actions/admin/admins";
import { useFlashMessage } from "@/hooks/useFlashMessage";

export function AdminGrantForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useFlashMessage();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    startTransition(async () => {
      const result = await grantAdminAccess(email.trim());
      if (result.success) {
        setSuccessMsg("Admin access granted.");
        setEmail("");
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        <div className="max-w-sm flex-1">
          <label className="mb-1.5 block text-[13px] text-[var(--text-mid)]">
            Email address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
              setSuccessMsg(null);
            }}
            placeholder="user@example.com"
            className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-2 text-[13px] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>

        <Button type="submit" disabled={isPending || !email.trim()} size="sm">
          {isPending ? "Granting…" : "Grant access"}
        </Button>
      </form>

      {error && <p className="mt-3 text-[12px] text-[var(--destructive)]">{error}</p>}
      {successMsg && <p className="mt-3 text-[12px] text-emerald-600">{successMsg}</p>}
    </div>
  );
}
