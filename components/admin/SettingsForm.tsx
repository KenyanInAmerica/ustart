// Editable form for admin-managed platform links.
// "use client" so the form can track pending/success/error state.

"use client";

import { useState, useTransition } from "react";
import { saveAdminSettings } from "@/lib/actions/admin/settings";
import { Button } from "@/components/ui/Button";
import type { AdminSettingsValues } from "@/lib/admin/data";

interface SettingsFormProps {
  initialValues: AdminSettingsValues;
}

function inputClassName() {
  return "w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-2 text-[13px] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none";
}

export function SettingsForm({ initialValues }: SettingsFormProps) {
  const [values, setValues] = useState(initialValues);
  const [committed, setCommitted] = useState(initialValues);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isDirty =
    values.whatsappInviteLink !== committed.whatsappInviteLink ||
    values.parentPackNotionUrl !== committed.parentPackNotionUrl ||
    values.parentContentNotionUrl !== committed.parentContentNotionUrl;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    startTransition(async () => {
      const result = await saveAdminSettings(values);
      if (result.success) {
        setCommitted(values);
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
        <label htmlFor="whatsapp-invite-link" className="mb-1.5 block text-[13px] text-[var(--text-mid)]">
          WhatsApp invite link
        </label>
        <input
          id="whatsapp-invite-link"
          type="url"
          value={values.whatsappInviteLink}
          onChange={(e) =>
            setValues((current) => ({ ...current, whatsappInviteLink: e.target.value }))
          }
          placeholder="https://chat.whatsapp.com/..."
          className={inputClassName()}
        />
        <p className="mt-1.5 text-[12px] text-[var(--text-muted)]">
          This link is shown to students on the community page after they agree to the rules.
        </p>
      </div>

      <div>
        <label htmlFor="parent-pack-notion-url" className="mb-1.5 block text-[13px] text-[var(--text-mid)]">
          Parent Pack Notion URL
        </label>
        <input
          id="parent-pack-notion-url"
          type="url"
          value={values.parentPackNotionUrl}
          onChange={(e) =>
            setValues((current) => ({ ...current, parentPackNotionUrl: e.target.value }))
          }
          placeholder="https://notion.so/..."
          className={inputClassName()}
        />
        <p className="mt-1.5 text-[12px] text-[var(--text-muted)]">
          The Notion page students see after purchasing the Parent Pack
        </p>
      </div>

      <div>
        <label htmlFor="parent-content-notion-url" className="mb-1.5 block text-[13px] text-[var(--text-mid)]">
          Parent Content Notion URL
        </label>
        <input
          id="parent-content-notion-url"
          type="url"
          value={values.parentContentNotionUrl}
          onChange={(e) =>
            setValues((current) => ({ ...current, parentContentNotionUrl: e.target.value }))
          }
          placeholder="https://notion.so/..."
          className={inputClassName()}
        />
        <p className="mt-1.5 text-[12px] text-[var(--text-muted)]">
          The Notion page parents see in their Parent Hub
        </p>
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
