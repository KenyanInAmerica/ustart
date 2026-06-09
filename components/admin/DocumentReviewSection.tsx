"use client";

import { useEffect, useState, useTransition } from "react";
import {
  adminFetchUserDocumentSubmissions,
  adminReviewSubmission,
} from "@/lib/actions/admin/documents";
import { getSubmissionDownloadUrl } from "@/lib/actions/documents";
import type {
  DocumentSubmission,
  DocumentSubmissionFile,
  DocumentSubmissionStatus,
} from "@/lib/types/documents";

type Props = {
  userId: string;
  userName: string;
  onPendingCountChange?: (count: number) => void;
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

type SubmissionGroup = {
  key: string;
  latest: DocumentSubmission;
  previous: DocumentSubmission[];
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatFileSize(size: number): string {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function groupSubmissions(submissions: DocumentSubmission[]): SubmissionGroup[] {
  const grouped = submissions.reduce<Record<string, DocumentSubmission[]>>(
    (groups, submission) => {
      const submissionKey = submission.task_id ?? submission.section_label ?? "general";
      return {
        ...groups,
        [submissionKey]: [...(groups[submissionKey] ?? []), submission],
      };
    },
    {}
  );

  return Object.entries(grouped)
    .map(([key, group]) => {
      const sorted = [...group].sort(
        (left, right) =>
          new Date(right.created_at).getTime() -
          new Date(left.created_at).getTime()
      );
      const [latest, ...previous] = sorted;
      if (!latest) return null;
      return { key, latest, previous };
    })
    .filter((group): group is SubmissionGroup => group !== null)
    .sort(
      (left, right) =>
        new Date(right.latest.created_at).getTime() -
        new Date(left.latest.created_at).getTime()
    );
}

function countLatestPending(submissions: DocumentSubmission[]) {
  return groupSubmissions(submissions).filter(
    (group) => group.latest.status === "pending_review"
  ).length;
}

async function withDownloadUrls(
  submissions: DocumentSubmission[]
): Promise<DocumentSubmission[]> {
  return Promise.all(
    submissions.map(async (submission) => ({
      ...submission,
      files: await Promise.all(
        submission.files.map(async (file) => ({
          ...file,
          signedUrl: await getSubmissionDownloadUrl(file.file_path),
        }))
      ),
    }))
  );
}

function FileLink({ file }: { file: DocumentSubmissionFile }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] px-3 py-2">
      <div className="min-w-0">
        <p className="truncate text-sm text-[var(--text)]">{file.file_name}</p>
        <p className="text-xs text-[var(--text-muted)]">
          {formatFileSize(file.file_size)}
        </p>
      </div>
      {file.signedUrl ? (
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
    </div>
  );
}

function ReviewForm({
  submission,
  onReviewed,
}: {
  submission: DocumentSubmission;
  onReviewed: (status: "approved" | "resubmit_requested", comment: string) => void;
}) {
  const [status, setStatus] = useState<"approved" | "resubmit_requested">(
    submission.status === "resubmit_requested" ? "resubmit_requested" : "approved"
  );
  const [comment, setComment] = useState(submission.admin_comment ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    startTransition(async () => {
      const result = await adminReviewSubmission(submission.id, {
        status,
        comment,
      });

      if (!result.success) {
        setMessage(result.error);
        return;
      }

      setMessage("Review saved.");
      onReviewed(status, comment.trim());
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-2">
      <select
        value={status}
        onChange={(event) =>
          setStatus(event.target.value as "approved" | "resubmit_requested")
        }
        className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-2 text-sm text-[var(--text)]"
      >
        <option value="approved">Approve</option>
        <option value="resubmit_requested">Request resubmission</option>
      </select>
      <textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        placeholder="Leave a comment for the student (optional)"
        required={status === "resubmit_requested"}
        rows={3}
        className="w-full resize-none rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)]"
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-[var(--radius-sm)] bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Saving..." : "Save review"}
      </button>
      {message && (
        <p className="text-xs text-[var(--text-muted)]">{message}</p>
      )}
    </form>
  );
}

export function DocumentReviewSection({
  userId,
  userName,
  onPendingCountChange,
}: Props) {
  const [submissions, setSubmissions] = useState<DocumentSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);

    adminFetchUserDocumentSubmissions(userId)
      .then(withDownloadUrls)
      .then((rows) => {
        if (cancelled) return;
        setSubmissions(rows);
        onPendingCountChange?.(countLatestPending(rows));
      })
      .catch((error) => {
        console.error("[DocumentReviewSection] Failed to load submissions:", error);
        if (!cancelled) setLoadError("Failed to load document submissions.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [onPendingCountChange, userId]);

  function updateSubmission(
    submissionId: string,
    status: "approved" | "resubmit_requested",
    comment: string
  ) {
    setEditingId(null);
    setSubmissions((current) => {
      const next = current.map((submission) =>
        submission.id === submissionId
          ? {
              ...submission,
              status,
              admin_comment: comment || null,
            }
          : submission
      );
      onPendingCountChange?.(countLatestPending(next));
      return next;
    });
  }

  if (isLoading) {
    return <p className="text-sm text-[var(--text-muted)]">Loading submissions...</p>;
  }

  if (loadError) {
    return <p className="text-sm text-[var(--destructive)]">{loadError}</p>;
  }

  if (submissions.length === 0) {
    return (
      <p className="text-sm text-[var(--text-muted)]">
        No document submissions from {userName} yet.
      </p>
    );
  }

  const groups = groupSubmissions(submissions);

  return (
    <div className="space-y-3">
      {groups.map(({ key, latest: submission, previous }) => {
        const showForm =
          submission.status === "pending_review" || editingId === submission.id;
        return (
          <article
            key={key}
            className="rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-3"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[var(--text)]">
                  {submission.section_label ?? "General"}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  {formatDate(submission.created_at)}
                </p>
              </div>
              <span
                className={`rounded-full px-2 py-1 text-xs font-semibold ${STATUS_CLASSES[submission.status]}`}
              >
                {STATUS_LABELS[submission.status]}
              </span>
            </div>

            <div className="space-y-2">
              {submission.files.map((file) => (
                <FileLink key={file.id} file={file} />
              ))}
            </div>

            {submission.admin_comment && !showForm && (
              <p className="mt-3 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] p-3 text-sm text-[var(--text)]">
                {submission.admin_comment}
              </p>
            )}

            {showForm ? (
              <ReviewForm
                submission={submission}
                onReviewed={(status, comment) =>
                  updateSubmission(submission.id, status, comment)
                }
              />
            ) : (
              <button
                type="button"
                onClick={() => setEditingId(submission.id)}
                className="mt-3 text-sm font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)]"
              >
                Update review
              </button>
            )}

            {previous.length > 0 && (
              <details className="mt-4 border-t border-[var(--border)] pt-3">
                <summary className="flex cursor-pointer list-none items-center gap-1 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text)]">
                  <svg
                    className="h-3 w-3"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                  {previous.length} previous version
                  {previous.length > 1 ? "s" : ""}
                </summary>
                <div className="mt-3 space-y-3 border-l-2 border-[var(--border)] pl-3">
                  {previous.map((historySubmission) => (
                    <div
                      key={historySubmission.id}
                      className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-subtle)] p-3"
                    >
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold text-[var(--text-mid)]">
                            {formatDate(historySubmission.created_at)}
                          </p>
                          <p className="text-xs text-[var(--text-muted)]">
                            {historySubmission.files.length} file
                            {historySubmission.files.length === 1 ? "" : "s"}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-semibold ${STATUS_CLASSES[historySubmission.status]}`}
                        >
                          {STATUS_LABELS[historySubmission.status]}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {historySubmission.files.map((file) => (
                          <FileLink key={file.id} file={file} />
                        ))}
                      </div>

                      {historySubmission.admin_comment && (
                        <p className="mt-3 rounded-[var(--radius-sm)] bg-white p-3 text-sm text-[var(--text)]">
                          {historySubmission.admin_comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </details>
            )}
          </article>
        );
      })}
    </div>
  );
}
