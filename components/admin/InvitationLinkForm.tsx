// Form for manually linking a parent to a student, bypassing the email invitation flow.
// Used by admins when a parent needs to be connected without going through magic-link.

"use client";

import { useState, useTransition } from "react";
import { adminLinkParent } from "@/lib/actions/admin/invitations";
import { Button } from "@/components/ui/Button";
import { useFlashMessage } from "@/hooks/useFlashMessage";

export function InvitationLinkForm() {
  const [studentEmail, setStudentEmail] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useFlashMessage();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    startTransition(async () => {
      const result = await adminLinkParent(studentEmail.trim(), parentEmail.trim());
      if (result.success) {
        setSuccessMsg("Parent linked successfully.");
        setStudentEmail("");
        setParentEmail("");
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-[13px] text-[var(--text-mid)]">
            Student email
          </label>
          <input
            type="email"
            value={studentEmail}
            onChange={(e) => { setStudentEmail(e.target.value); setError(null); }}
            placeholder="student@example.com"
            className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-2 text-[13px] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] text-[var(--text-mid)]">
            Parent email
          </label>
          <input
            type="email"
            value={parentEmail}
            onChange={(e) => { setParentEmail(e.target.value); setError(null); }}
            placeholder="parent@example.com"
            className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-2 text-[13px] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>
      </div>

      {error && <p className="text-[12px] text-[var(--destructive)]">{error}</p>}
      {successMsg && <p className="text-[12px] text-emerald-600">{successMsg}</p>}

      <Button
        type="submit"
        disabled={isPending || !studentEmail.trim() || !parentEmail.trim()}
        size="sm"
      >
        {isPending ? "Linking…" : "Link parent"}
      </Button>
    </form>
  );
}
