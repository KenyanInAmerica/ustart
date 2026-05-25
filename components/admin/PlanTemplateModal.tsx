"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import {
  createPlanTemplate,
  updatePlanTemplate,
} from "@/lib/actions/admin/planTemplates";
import { useFlashMessage } from "@/hooks/useFlashMessage";
import { verifyNotionUrl } from "@/lib/actions/admin/verifyNotionUrl";
import { isNotionUrl } from "@/lib/notion/urlConverter";
import {
  PLAN_PHASES,
  PLAN_PHASE_LABELS,
  type CreatePlanTemplateData,
  type PlanTaskTemplate,
} from "@/lib/types/plan";
import type { TierId } from "@/lib/config/pricing";

interface PlanTemplateModalProps {
  mode: "create" | "edit";
  template?: PlanTaskTemplate;
  onClose: () => void;
}

interface FormState {
  title: string;
  description: string;
  phase: CreatePlanTemplateData["phase"];
  days_from_arrival: string;
  tier_required: TierId;
  content_url: string;
  video_url: string;
}

const TIER_OPTIONS: { value: TierId; label: string }[] = [
  { value: "lite", label: "Lite" },
  { value: "explore", label: "Explore" },
  { value: "concierge", label: "Concierge" },
];

function buildInitialState(template?: PlanTaskTemplate): FormState {
  return {
    title: template?.title ?? "",
    description: template?.description ?? "",
    phase: template?.phase ?? "before_arrival",
    days_from_arrival: String(template?.days_from_arrival ?? 0),
    tier_required: template?.tier_required ?? "lite",
    content_url: template?.content_url ?? "",
    video_url: template?.video_url ?? "",
  };
}

export function PlanTemplateModal({
  mode,
  template,
  onClose,
}: PlanTemplateModalProps) {
  const [form, setForm] = useState<FormState>(buildInitialState(template));
  const [initialForm, setInitialForm] = useState<FormState>(buildInitialState(template));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verifiedCaption, setVerifiedCaption] = useFlashMessage();

  useEffect(() => {
    const next = buildInitialState(template);
    setForm(next);
    setInitialForm(next);
    setError(null);
    setVerificationError(null);
    setVerifiedCaption(null);
    setIsVerifying(false);
  }, [template, mode, setVerifiedCaption]);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const isDirty =
    form.title !== initialForm.title ||
    form.description !== initialForm.description ||
    form.phase !== initialForm.phase ||
    form.days_from_arrival !== initialForm.days_from_arrival ||
    form.tier_required !== initialForm.tier_required ||
    form.content_url !== initialForm.content_url ||
    form.video_url !== initialForm.video_url;

  function updateField<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleGenerateLink() {
    const value = form.content_url.trim();
    if (!value || !isNotionUrl(value)) return;

    setVerificationError(null);
    setVerifiedCaption(null);
    setIsVerifying(true);

    const result = await verifyNotionUrl(value, form.tier_required);
    setIsVerifying(false);

    if (result.valid && result.convertedUrl) {
      updateField("content_url", result.convertedUrl);
      setVerifiedCaption(`✓ Final URL: ${result.convertedUrl}`);
    } else {
      setVerificationError(result.error ?? "Verification failed.");
    }
  }

  function handlePreview() {
    const value = form.content_url.trim();
    if (!value.startsWith("/")) return;
    window.open(window.location.origin + value, "_blank", "noreferrer");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const daysFromArrival = Number(form.days_from_arrival);

    if (!Number.isInteger(daysFromArrival)) {
      setError("Days from arrival must be a whole number.");
      return;
    }

    const payload: CreatePlanTemplateData = {
      title: form.title,
      description: form.description,
      phase: form.phase,
      days_from_arrival: daysFromArrival,
      tier_required: form.tier_required,
      content_url: form.content_url,
      video_url: form.video_url,
    };

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createPlanTemplate(payload)
          : await updatePlanTemplate(template!.id, payload);

      if (result.success) {
        onClose();
        return;
      }

      setError(result.error);
    });
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-navy/40 p-4 backdrop-blur-sm">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        aria-label="Close modal"
      />
      <div className="relative z-10 w-full max-w-lg rounded-[var(--radius-lg)] bg-white p-6 shadow-[var(--shadow-lg)]">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-[var(--text)]">
              {mode === "create" ? "Add template" : "Edit template"}
            </h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Configure when the task appears and which members can access it.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
            aria-label="Close modal"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-[13px] text-[var(--text-mid)]">Title</span>
            <input
              id="plan-template-title"
              required
              type="text"
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
              className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-2 text-[13px] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[13px] text-[var(--text-mid)]">Description</span>
            <textarea
              id="plan-template-description"
              rows={3}
              value={form.description}
              onChange={(event) => updateField("description", event.target.value)}
              className="w-full resize-none rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-2 text-[13px] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[13px] text-[var(--text-mid)]">Phase</span>
              <select
                id="plan-template-phase"
                value={form.phase}
                onChange={(event) => updateField("phase", event.target.value as CreatePlanTemplateData["phase"])}
                className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-2 text-[13px] text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
              >
                {PLAN_PHASES.map((phase) => (
                  <option key={phase} value={phase}>
                    {PLAN_PHASE_LABELS[phase]}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[13px] text-[var(--text-mid)]">Tier required</span>
              <select
                id="plan-template-tier-required"
                value={form.tier_required}
                onChange={(event) => updateField("tier_required", event.target.value as TierId)}
                className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-2 text-[13px] text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
              >
                {TIER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-[13px] text-[var(--text-mid)]">Days from arrival</span>
            <input
              id="plan-template-days-from-arrival"
              required
              type="number"
              value={form.days_from_arrival}
              onChange={(event) => updateField("days_from_arrival", event.target.value)}
              className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-2 text-[13px] text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
            />
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Negative numbers schedule tasks before arrival. 0 = day of arrival.
            </p>
          </label>

          <div className="block">
            <span className="mb-1.5 block text-[13px] text-[var(--text-mid)]">Content URL</span>
            <input
              id="plan-template-content-url"
              aria-label="Content URL"
              type="text"
              value={form.content_url}
              onChange={(event) => {
                updateField("content_url", event.target.value);
                setVerificationError(null);
                setVerifiedCaption(null);
              }}
              placeholder="Paste a Notion URL to generate a UStart link"
              className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-2 text-[13px] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none"
            />

            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={handleGenerateLink}
                disabled={isVerifying || !isNotionUrl(form.content_url.trim())}
                className="shrink-0 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-2 text-[13px] text-[var(--text-mid)] hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
              >
                {isVerifying ? (
                  <span className="animate-spin inline-block">⟳</span>
                ) : (
                  "Generate UStart Link"
                )}
              </button>

              <button
                type="button"
                onClick={handlePreview}
                disabled={!form.content_url.trim().startsWith("/")}
                className="shrink-0 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-2 text-[13px] text-[var(--text-mid)] hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
              >
                Preview
              </button>
            </div>

            {verifiedCaption && (
              <p className="mt-1.5 text-xs text-emerald-600">{verifiedCaption}</p>
            )}

            {verificationError && (
              <p className="mt-1.5 text-xs text-[var(--destructive)]">{verificationError}</p>
            )}
          </div>

          <div className="block">
            <span className="mb-1.5 block text-[13px] text-[var(--text-mid)]">Video URL</span>
            <input
              id="plan-template-video-url"
              aria-label="Video URL"
              type="text"
              value={form.video_url}
              onChange={(event) => updateField("video_url", event.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-2 text-[13px] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none"
            />
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Paste a YouTube, Vimeo, or Loom URL. The video will be embedded on the content page
              and shown as a badge on the task card.
            </p>
          </div>

          {error && <p className="text-sm text-[var(--destructive)]">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={isPending} disabled={!isDirty || isPending}>
              {mode === "create" ? "Create template" : "Save changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
