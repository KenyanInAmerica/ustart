// Editable form for the admin settings page.
// Currently handles the WhatsApp invite link stored in the config table.
// "use client" so the form can track pending/success/error state.

"use client";

import { useState, useTransition } from "react";
import { saveWhatsappLink } from "@/lib/actions/admin/settings";
import { Button } from "@/components/ui/Button";

interface SettingsFormProps {
  initialLink: string;
}

export function SettingsForm({ initialLink }: SettingsFormProps) {
  const [link, setLink] = useState(initialLink);
  // committed tracks the last successfully saved value so we can tell whether
  // the current input is actually different and the Save button should be active.
  const [committed, setCommitted] = useState(initialLink);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isDirty = link !== committed;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    startTransition(async () => {
      const result = await saveWhatsappLink(link);
      if (result.success) {
        setCommitted(link);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(result.error);
        setTimeout(() => setError(null), 3000);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <div>
        <label className="mb-1.5 block text-[13px] text-[var(--text-mid)]">
          WhatsApp invite link
        </label>
        <input
          type="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://chat.whatsapp.com/..."
          className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-2 text-[13px] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none"
        />
      </div>

      {error && <p className="text-[12px] text-[var(--destructive)]">{error}</p>}
      {saved && <p className="text-[12px] text-emerald-600">Saved successfully.</p>}

      <Button
        type="submit"
        disabled={isPending || !isDirty}
        size="sm"
      >
        {isPending ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
