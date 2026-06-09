"use client";

import { DocumentUpload } from "@/components/documents/DocumentUpload";
import { SubmissionCard } from "@/components/documents/SubmissionCard";
import type { DocumentSubmission } from "@/lib/types/documents";

type Props = {
  taskId: string;
  templateId: string;
  sectionLabel: string;
  submissions: DocumentSubmission[];
};

export function TaskUploadClient({
  taskId,
  templateId,
  sectionLabel,
  submissions,
}: Props) {
  const sortedSubmissions = [...submissions].sort(
    (left, right) =>
      new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
  );
  const [latestSubmission, ...previousSubmissions] = sortedSubmissions;

  return (
    <>
      {latestSubmission && (
        <div className="mb-4">
          <SubmissionCard
            submission={latestSubmission}
            isLatest
            showTitle={false}
          />

          {previousSubmissions.length > 0 && (
            <details className="mt-2">
              <summary className="flex cursor-pointer list-none items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text)]">
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
                {previousSubmissions.length} previous submission
                {previousSubmissions.length > 1 ? "s" : ""}
              </summary>
              <div className="mt-2 space-y-2 border-l-2 border-[var(--border)] pl-2">
                {previousSubmissions.map((submission) => (
                  <SubmissionCard
                    key={submission.id}
                    submission={submission}
                    isLatest={false}
                    showTitle={false}
                  />
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      <DocumentUpload
        taskId={taskId}
        templateId={templateId}
        sectionLabel={sectionLabel}
      />
    </>
  );
}
