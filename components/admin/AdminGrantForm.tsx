"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { grantAdminAccess } from "@/lib/actions/admin/admins";

export function AdminGrantForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await grantAdminAccess(email.trim());
      if (result.success) {
        setSuccess(true);
        setEmail("");
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.error);
        setTimeout(() => setError(null), 3000);
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
              setSuccess(false);
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
      {success && <p className="mt-3 text-[12px] text-emerald-600">Admin access granted.</p>}
    </div>
  );
}
