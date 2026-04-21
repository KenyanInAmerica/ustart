// Form for uploading a new PDF content item to the admin content library.
// Submits via FormData to the uploadContentItem server action which handles
// Supabase Storage upload + content_items row insertion.

"use client";

import { useRef, useState, useTransition, useEffect } from "react";
import { uploadContentItem } from "@/lib/actions/admin/content";
import { Button } from "@/components/ui/Button";
import type { ContentItem } from "@/types/admin";

const TIERS: { value: ContentItem["tier"]; label: string }[] = [
  { value: "lite", label: "Lite" },
  { value: "pro", label: "Pro" },
  { value: "premium", label: "Premium" },
  { value: "parent_pack", label: "Parent Pack" },
  { value: "explore", label: "Explore" },
  { value: "concierge", label: "Concierge" },
];

export function ContentUploadForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
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

    const form = formRef.current;
    if (!form) return;
    const formData = new FormData(form);

    startTransition(async () => {
      const result = await uploadContentItem(formData);
      if (result.success) {
        setSuccess(true);
        setFileName(null);
        form.reset();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <div>
        <label className="mb-1.5 block text-[13px] text-[var(--text-mid)]">Title</label>
        <input
          name="title"
          type="text"
          required
          placeholder="e.g. SSN Application Guide"
          onChange={() => { setError(null); setSuccess(false); }}
          className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-2 text-[13px] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-[13px] text-[var(--text-mid)]">Description</label>
        <textarea
          name="description"
          required
          rows={2}
          placeholder="Brief description of the content"
          onChange={() => { setError(null); setSuccess(false); }}
          className="w-full resize-none rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-2 text-[13px] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-[13px] text-[var(--text-mid)]">Category</label>
          <select
            name="tier"
            required
            defaultValue=""
            className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-2 text-[13px] text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
          >
            <option value="" disabled>Select category…</option>
            {TIERS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] text-[var(--text-mid)]">PDF file</label>
          {/* Hidden file input; custom label shows the selected filename */}
          <label className="flex w-full cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-2 transition-colors hover:border-[var(--border-md)]">
            <input
              name="file"
              type="file"
              accept="application/pdf"
              required
              className="sr-only"
              onChange={(e) => {
                setFileName(e.target.files?.[0]?.name ?? null);
                setError(null);
                setSuccess(false);
              }}
            />
            <svg className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <span className="truncate text-[13px] text-[var(--text-muted)]">
              {fileName ?? "Choose PDF…"}
            </span>
          </label>
        </div>
      </div>

      {error && <p className="text-[12px] text-[var(--destructive)]">{error}</p>}
      {success && <p className="text-[12px] text-emerald-600">Uploaded successfully.</p>}

      <Button
        type="submit"
        disabled={isPending}
        size="sm"
      >
        {isPending ? "Uploading…" : "Upload"}
      </Button>
    </form>
  );
}
