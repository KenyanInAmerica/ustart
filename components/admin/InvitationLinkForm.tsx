// Form for manually linking a parent to a student, bypassing the email invitation flow.
// Used by admins when a parent needs to be connected without going through magic-link.

"use client";

import { useState, useTransition, useEffect } from "react";
import { adminLinkParent } from "@/lib/actions/admin/invitations";

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
          <label className="block text-[13px] text-white/60 mb-1.5">
            Student email
          </label>
          <input
            type="email"
            value={studentEmail}
            onChange={(e) => { setStudentEmail(e.target.value); setError(null); }}
            placeholder="student@example.com"
            className="w-full bg-white/[0.05] border border-white/[0.10] rounded-lg px-3 py-2 text-[13px] text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
          />
        </div>
        <div>
          <label className="block text-[13px] text-white/60 mb-1.5">
            Parent email
          </label>
          <input
            type="email"
            value={parentEmail}
            onChange={(e) => { setParentEmail(e.target.value); setError(null); }}
            placeholder="parent@example.com"
            className="w-full bg-white/[0.05] border border-white/[0.10] rounded-lg px-3 py-2 text-[13px] text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
          />
        </div>
      </div>

      {error && <p className="text-red-400 text-[12px]">{error}</p>}
      {success && <p className="text-emerald-400 text-[12px]">Parent linked successfully.</p>}

      <button
        type="submit"
        disabled={isPending || !studentEmail.trim() || !parentEmail.trim()}
        className="px-4 py-2 bg-white text-[#0C1220] text-[13px] font-medium rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50"
      >
        {isPending ? "Linking…" : "Link parent"}
      </button>
    </form>
  );
}
