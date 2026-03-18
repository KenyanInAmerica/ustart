// Form for uploading a new PDF content item to the admin content library.
// Submits via FormData to the uploadContentItem server action which handles
// Supabase Storage upload + content_items row insertion.

"use client";

import { useRef, useState, useTransition } from "react";
import { uploadContentItem } from "@/lib/actions/admin/content";
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
        <label className="block text-[13px] text-white/60 mb-1.5">Title</label>
        <input
          name="title"
          type="text"
          required
          placeholder="e.g. SSN Application Guide"
          onChange={() => { setError(null); setSuccess(false); }}
          className="w-full bg-white/[0.05] border border-white/[0.10] rounded-lg px-3 py-2 text-[13px] text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
        />
      </div>

      <div>
        <label className="block text-[13px] text-white/60 mb-1.5">Description</label>
        <textarea
          name="description"
          required
          rows={2}
          placeholder="Brief description of the content"
          onChange={() => { setError(null); setSuccess(false); }}
          className="w-full bg-white/[0.05] border border-white/[0.10] rounded-lg px-3 py-2 text-[13px] text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[13px] text-white/60 mb-1.5">Category</label>
          <select
            name="tier"
            required
            defaultValue=""
            className="w-full bg-white/[0.05] border border-white/[0.10] rounded-lg px-3 py-2 text-[13px] text-white focus:outline-none focus:border-white/30"
          >
            <option value="" disabled>Select category…</option>
            {TIERS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[13px] text-white/60 mb-1.5">PDF file</label>
          {/* Hidden file input; custom label shows the selected filename */}
          <label className="flex items-center gap-2 w-full bg-white/[0.05] border border-white/[0.10] rounded-lg px-3 py-2 cursor-pointer hover:border-white/30 transition-colors">
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
            <svg className="w-3.5 h-3.5 text-white/40 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <span className="text-[13px] truncate text-white/40">
              {fileName ?? "Choose PDF…"}
            </span>
          </label>
        </div>
      </div>

      {error && <p className="text-red-400 text-[12px]">{error}</p>}
      {success && <p className="text-emerald-400 text-[12px]">Uploaded successfully.</p>}

      <button
        type="submit"
        disabled={isPending}
        className="px-4 py-2 bg-white text-[#0C1220] text-[13px] font-medium rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50"
      >
        {isPending ? "Uploading…" : "Upload"}
      </button>
    </form>
  );
}
