// Editable form for the admin settings page.
// Currently handles the WhatsApp invite link stored in the config table.
// "use client" so the form can track pending/success/error state.

"use client";

import { useState, useTransition } from "react";
import { saveWhatsappLink } from "@/lib/actions/admin/settings";

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
        <label className="block text-[13px] text-white/60 mb-1.5">
          WhatsApp invite link
        </label>
        <input
          type="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://chat.whatsapp.com/..."
          className="w-full bg-white/[0.05] border border-white/[0.10] rounded-lg px-3 py-2 text-[13px] text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
        />
      </div>

      {error && <p className="text-red-400 text-[12px]">{error}</p>}
      {saved && <p className="text-emerald-400 text-[12px]">Saved successfully.</p>}

      <button
        type="submit"
        disabled={isPending || !isDirty}
        className="px-4 py-2 bg-white text-[#0C1220] text-[13px] font-medium rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50"
      >
        {isPending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
