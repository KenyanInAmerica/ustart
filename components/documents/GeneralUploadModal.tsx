"use client";

import { DocumentUpload } from "@/components/documents/DocumentUpload";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  taskId?: string;
  sectionLabel?: string;
};

export function GeneralUploadModal({
  isOpen,
  onClose,
  taskId,
  sectionLabel = "General",
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-navy/40 p-4 backdrop-blur-sm">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        aria-label="Close upload modal"
      />
      <div className="relative z-10 w-full max-w-lg rounded-[var(--radius-lg)] bg-white p-6 shadow-[var(--shadow-lg)]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-[var(--text)]">
              Upload a Document
            </h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Upload any document for the UStart team to review.
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

        <DocumentUpload
          taskId={taskId}
          sectionLabel={sectionLabel}
          onSuccess={onClose}
        />
      </div>
    </div>
  );
}
