// Editable form for admin-managed platform links.
// "use client" so the form can track pending/success/error state.

"use client";

import { useState, useTransition } from "react";
import { saveAdminSettings } from "@/lib/actions/admin/settings";
import { Button } from "@/components/ui/Button";
import { useFlashMessage } from "@/hooks/useFlashMessage";
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
  const [savedMsg, setSavedMsg] = useFlashMessage();
  const [isPending, startTransition] = useTransition();

  const isDirty =
    values.whatsappInviteLink !== committed.whatsappInviteLink ||
    values.parentPackNotionUrl !== committed.parentPackNotionUrl ||
    values.parentContentNotionUrl !== committed.parentContentNotionUrl ||
    values.instagramUrl !== committed.instagramUrl ||
    values.tiktokUrl !== committed.tiktokUrl ||
    values.affiliateDisclosureEnabled !== committed.affiliateDisclosureEnabled;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSavedMsg(null);

    startTransition(async () => {
      const result = await saveAdminSettings(values);
      if (result.success) {
        setCommitted(values);
        setSavedMsg("Saved successfully.");
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-8">
      <section className="space-y-4">
        <div>
          <h3 className="text-[13px] font-medium text-[var(--text)]">Community</h3>
        </div>
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
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-[13px] font-medium text-[var(--text)]">Notion</h3>
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
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-[13px] font-medium text-[var(--text)]">Footer &amp; Legal</h3>
        </div>
        <div>
          <label htmlFor="instagram-url" className="mb-1.5 block text-[13px] text-[var(--text-mid)]">
            Instagram URL
          </label>
          <input
            id="instagram-url"
            type="text"
            value={values.instagramUrl}
            onChange={(e) =>
              setValues((current) => ({ ...current, instagramUrl: e.target.value }))
            }
            placeholder="https://instagram.com/ustart.us"
            className={inputClassName()}
          />
          <p className="mt-1.5 text-[12px] text-[var(--text-muted)]">
            Public Instagram profile URL. Leave blank to hide from footer.
          </p>
        </div>

        <div>
          <label htmlFor="tiktok-url" className="mb-1.5 block text-[13px] text-[var(--text-mid)]">
            TikTok URL
          </label>
          <input
            id="tiktok-url"
            type="text"
            value={values.tiktokUrl}
            onChange={(e) =>
              setValues((current) => ({ ...current, tiktokUrl: e.target.value }))
            }
            placeholder="https://www.tiktok.com/@ustart"
            className={inputClassName()}
          />
          <p className="mt-1.5 text-[12px] text-[var(--text-muted)]">
            TikTok profile URL. Leave blank until account is live.
          </p>
        </div>

        <label
          htmlFor="affiliate-disclosure-enabled"
          className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-subtle)] p-3"
        >
          <input
            id="affiliate-disclosure-enabled"
            type="checkbox"
            checked={values.affiliateDisclosureEnabled}
            onChange={(e) =>
              setValues((current) => ({
                ...current,
                affiliateDisclosureEnabled: e.target.checked,
              }))
            }
            className="mt-1 h-4 w-4 rounded border-[var(--border)] accent-[var(--accent)]"
          />
          <span>
            <span className="block text-[13px] text-[var(--text-mid)]">
              Show affiliate disclosure
            </span>
            <span className="mt-1 block text-[12px] text-[var(--text-muted)]">
              Display affiliate disclosure text in the footer. Enable once affiliate links are live on the site.
            </span>
          </span>
        </label>
      </section>

      {error && <p className="text-[12px] text-[var(--destructive)]">{error}</p>}
      {savedMsg && <p className="text-[12px] text-emerald-600">{savedMsg}</p>}

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
