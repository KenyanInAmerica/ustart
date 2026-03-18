// Form for granting admin access to an existing user by email.
// Calls grantAdminAccess server action; the target user must already have an account.

"use client";

import { useState, useTransition } from "react";
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
        <div className="flex-1 max-w-sm">
          <label className="block text-[13px] text-white/60 mb-1.5">
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
            className="w-full bg-white/[0.05] border border-white/[0.10] rounded-lg px-3 py-2 text-[13px] text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
          />
        </div>

        <button
          type="submit"
          disabled={isPending || !email.trim()}
          className="px-4 py-2 bg-white text-[#0C1220] text-[13px] font-medium rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50 shrink-0"
        >
          {isPending ? "Granting…" : "Grant access"}
        </button>
      </form>

      {/* Feedback below the input row, not inside the flex container */}
      {error && <p className="text-red-400 text-[12px] mt-3">{error}</p>}
      {success && <p className="text-emerald-400 text-[12px] mt-3">Admin access granted.</p>}
    </div>
  );
}
