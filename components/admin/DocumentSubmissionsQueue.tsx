"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { adminReviewSubmission } from "@/lib/actions/admin/documents";
import type {
  AdminDocumentSubmission,
} from "@/lib/admin/data";
import type { DocumentSubmissionStatus } from "@/lib/types/documents";

type Props = {
  submissions: AdminDocumentSubmission[];
  activeFilter?: QueueFilter;
};

type QueueFilter = "all" | DocumentSubmissionStatus;

type SubmissionGroup = {
  key: string;
  latest: AdminDocumentSubmission;
  previous: AdminDocumentSubmission[];
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

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function studentName(submission: AdminDocumentSubmission): string {
  return (
    [submission.student_first_name, submission.student_last_name]
      .filter(Boolean)
      .join(" ") ||
    submission.student_email ||
    "Student"
  );
}

function groupSubmissions(submissions: AdminDocumentSubmission[]): SubmissionGroup[] {
  const grouped = submissions.reduce<Record<string, AdminDocumentSubmission[]>>(
    (groups, submission) => {
      const submissionKey = submission.task_id ?? submission.section_label ?? "general";
      const key = `${submission.user_id}:${submissionKey}`;
      return {
        ...groups,
        [key]: [...(groups[key] ?? []), submission],
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

export function DocumentSubmissionsQueue({
  submissions,
  activeFilter = "all",
}: Props) {
  const [rows, setRows] = useState(submissions);
  const [comments, setComments] = useState<Record<string, string>>({});
  const [errorById, setErrorById] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setRows(submissions);
    setComments({});
    setErrorById({});
  }, [submissions]);

  function reviewSubmission(
    submissionId: string,
    status: "approved" | "resubmit_requested"
  ) {
    const comment = comments[submissionId] ?? "";
    setErrorById((current) => ({ ...current, [submissionId]: "" }));

    startTransition(async () => {
      const result = await adminReviewSubmission(submissionId, {
        status,
        comment,
      });

      if (!result.success) {
        setErrorById((current) => ({ ...current, [submissionId]: result.error }));
        return;
      }

      setRows((current) =>
        current.map((row) =>
          row.id === submissionId
            ? {
                ...row,
                status,
                admin_comment: comment.trim() || null,
              }
            : row
        )
      );
    });
  }

  const groups = groupSubmissions(rows).filter((group) =>
    activeFilter === "all" ? true : group.latest.status === activeFilter
  );

  if (groups.length === 0) {
    return (
      <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-6">
        <p className="text-sm text-[var(--text-muted)]">
          No document submissions match this filter.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map(({ key, latest: submission, previous }) => {
        const isApproveDisabled = isPending || submission.status === "approved";
        const isResubmitDisabled =
          isPending || submission.status === "resubmit_requested";

        return (
          <article
            key={key}
            className="rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-5"
          >
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <Link
                  href={`/admin/users?q=${encodeURIComponent(
                    submission.student_email ?? ""
                  )}`}
                  className="text-sm font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)]"
                >
                  {studentName(submission)}
                </Link>
                <p className="text-xs text-[var(--text-muted)]">
                  {submission.student_email ?? "No email"}
                </p>
                <p className="mt-2 text-sm text-[var(--text)]">
                  {submission.section_label ?? "General"}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  {submission.files.length} file{submission.files.length === 1 ? "" : "s"} · {formatDate(submission.created_at)}
                </p>
              </div>
              <span
                className={`w-fit rounded-full px-2 py-1 text-xs font-semibold ${STATUS_CLASSES[submission.status]}`}
              >
                {STATUS_LABELS[submission.status]}
              </span>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              {submission.files.map((file) =>
                file.signedUrl ? (
                  <a
                    key={file.id}
                    href={file.signedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-1.5 text-sm text-[var(--text-mid)] hover:text-[var(--accent)]"
                  >
                    {file.file_name}
                  </a>
                ) : (
                  <span
                    key={file.id}
                    className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-1.5 text-sm text-[var(--text-muted)]"
                  >
                    {file.file_name}
                  </span>
                )
              )}
            </div>

            <div className="space-y-2">
              <textarea
                value={comments[submission.id] ?? ""}
                onChange={(event) =>
                  setComments((current) => ({
                    ...current,
                    [submission.id]: event.target.value,
                  }))
                }
                placeholder="Review comment (optional for approval, required for resubmission)"
                aria-label="Review comment"
                rows={2}
                className="w-full resize-none rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)]"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={isApproveDisabled}
                  onClick={() => reviewSubmission(submission.id, "approved")}
                  className="rounded-[var(--radius-sm)] bg-[#4ECBA5] px-3 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Approve
                </button>
                <button
                  type="button"
                  disabled={isResubmitDisabled}
                  onClick={() =>
                    reviewSubmission(submission.id, "resubmit_requested")
                  }
                  className="rounded-[var(--radius-sm)] bg-[#F5C842] px-3 py-2 text-sm font-semibold text-[var(--text)] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Request resubmit
                </button>
              </div>
              {errorById[submission.id] && (
                <p className="text-sm text-[var(--destructive)]">
                  {errorById[submission.id]}
                </p>
              )}
            </div>

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
                      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
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
                          className={`w-fit rounded-full px-2 py-1 text-xs font-semibold ${STATUS_CLASSES[historySubmission.status]}`}
                        >
                          {STATUS_LABELS[historySubmission.status]}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {historySubmission.files.map((file) =>
                          file.signedUrl ? (
                            <a
                              key={file.id}
                              href={file.signedUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-white px-3 py-1.5 text-sm text-[var(--text-mid)] hover:text-[var(--accent)]"
                            >
                              {file.file_name}
                            </a>
                          ) : (
                            <span
                              key={file.id}
                              className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-white px-3 py-1.5 text-sm text-[var(--text-muted)]"
                            >
                              {file.file_name}
                            </span>
                          )
                        )}
                      </div>

                      {historySubmission.admin_comment && (
                        <p className="mt-3 rounded-[var(--radius-sm)] bg-white p-2 text-sm text-[var(--text)]">
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
