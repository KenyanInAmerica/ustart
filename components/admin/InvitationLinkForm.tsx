// Form for manually linking a parent to a student, bypassing the email invitation flow.
// Used by admins when a parent needs to be connected without going through magic-link.

"use client";

import { useState, useTransition, useEffect } from "react";
import { adminLinkParent } from "@/lib/actions/admin/invitations";
import { Button } from "@/components/ui/Button";

export function InvitationLinkForm() {
  const [studentEmail, setStudentEmail] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Auto-dismiss success message after 3 seconds.
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await adminLinkParent(studentEmail.trim(), parentEmail.trim());
      if (result.success) {
        setSuccess(true);
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
      {success && <p className="text-[12px] text-emerald-600">Parent linked successfully.</p>}

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
