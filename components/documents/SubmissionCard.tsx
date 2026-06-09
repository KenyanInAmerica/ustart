"use client";

import { useState } from "react";
import { DocumentUpload } from "@/components/documents/DocumentUpload";
import type {
  DocumentSubmission,
  DocumentSubmissionStatus,
} from "@/lib/types/documents";

type Props = {
  submission: DocumentSubmission;
  showSignedUrls?: boolean;
  isLatest?: boolean;
  showTitle?: boolean;
};

const STATUS_LABELS: Record<DocumentSubmissionStatus, string> = {
  pending_review: "Pending Review",
  approved: "Approved",
  resubmit_requested: "Resubmit Requested",
  cancelled: "Cancelled",
};

const STATUS_CLASSES: Record<DocumentSubmissionStatus, string> = {
  pending_review: "bg-[#F5C842]/20 text-yellow-700",
  approved: "bg-[#4ECBA5]/20 text-[#4ECBA5]",
  resubmit_requested: "bg-[var(--destructive)]/10 text-[var(--destructive)]",
  cancelled: "bg-[var(--bg-subtle)] text-[var(--text-muted)]",
};

function formatFileSize(size: number): string {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function fileIcon(fileType: string): string {
  if (fileType === "application/pdf") return "PDF";
  if (fileType.startsWith("image/")) return "IMG";
  return "DOC";
}

export function SubmissionCard({
  submission,
  showSignedUrls = true,
  isLatest = true,
  showTitle = false,
}: Props) {
  const [isUploadingVersion, setIsUploadingVersion] = useState(false);

  return (
    <article
      className={[
        "rounded-[var(--radius-md)] border border-[var(--border)] bg-white",
        isLatest ? "p-4" : "p-3 shadow-none",
      ].join(" ")}
    >
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {showTitle && (
            <h3
              className={[
                "font-medium text-[var(--text)]",
                isLatest ? "text-sm" : "text-xs",
              ].join(" ")}
            >
              {submission.section_label ?? "General submission"}
            </h3>
          )}
          <p
            className={[
              "text-xs",
              isLatest ? "text-[var(--text-muted)]" : "font-medium text-[var(--text-mid)]",
            ].join(" ")}
          >
            {formatDate(submission.created_at)}
          </p>
        </div>
        <span
          className={`w-fit rounded-full px-2 py-1 text-xs font-semibold ${STATUS_CLASSES[submission.status]}`}
        >
          {STATUS_LABELS[submission.status]}
        </span>
      </div>

      <ul className="space-y-2">
        {submission.files.map((file) => (
          <li
            key={file.id}
            className="flex items-center justify-between gap-3 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] px-3 py-2"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="shrink-0 rounded-[var(--radius-sm)] border border-[var(--border)] bg-white px-2 py-1 text-[10px] font-semibold text-[var(--text-mid)]">
                {fileIcon(file.file_type)}
              </span>
              <div className="min-w-0">
              <p
                className={[
                  "truncate text-[var(--text)]",
                  isLatest ? "text-sm" : "text-xs",
                ].join(" ")}
              >
                {file.file_name}
              </p>
                <p className="text-xs text-[var(--text-muted)]">
                  {formatFileSize(file.file_size)}
                </p>
              </div>
            </div>
            {showSignedUrls && file.signedUrl ? (
              <a
                href={file.signedUrl}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 text-sm font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)]"
              >
                Download
              </a>
            ) : (
              <span className="shrink-0 text-xs text-[var(--text-muted)]">
                Link unavailable
              </span>
            )}
          </li>
        ))}
      </ul>

      {submission.admin_comment && (
        <div className="mt-3 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] p-3">
          <p className="mb-1 text-xs font-semibold text-[var(--text-muted)]">
            Reviewer comment
          </p>
          <p className="text-sm text-[var(--text)]">{submission.admin_comment}</p>
        </div>
      )}

      {isLatest && submission.status === "resubmit_requested" && (
        <div className="mt-4">
          {isUploadingVersion ? (
            <DocumentUpload
              taskId={submission.task_id ?? undefined}
              templateId={submission.template_id ?? undefined}
              sectionLabel={submission.section_label ?? undefined}
              onSuccess={() => setIsUploadingVersion(false)}
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsUploadingVersion(true)}
              className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-2 text-sm font-semibold text-[var(--text-mid)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              Upload new version
            </button>
          )}
        </div>
      )}
    </article>
  );
}
