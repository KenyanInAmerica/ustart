import { TaskUploadClient } from "@/components/documents/TaskUploadClient";
import {
  fetchSubmissionFiles,
  fetchUserSubmissions,
} from "@/lib/actions/documents";

type Props = {
  taskId: string;
  templateId: string;
  sectionLabel: string;
  userId: string;
};

export async function TaskUploadSection({
  taskId,
  templateId,
  sectionLabel,
  userId,
}: Props) {
  const submissions = (await fetchUserSubmissions(userId)).filter(
    (submission) => submission.task_id === taskId
  );
  const submissionsWithUrls = await Promise.all(
    submissions.map(async (submission) => ({
      ...submission,
      files: await fetchSubmissionFiles(submission.id),
    }))
  );

  return (
    <div className="mt-6 border-t border-[var(--border)] pt-6">
      <h3 className="mb-1 font-semibold text-[var(--text)]">
        Document Submission
      </h3>
      <p className="mb-4 text-sm text-[var(--text-muted)]">
        Upload any documents related to this task. A reviewer will review them
        and provide feedback.
      </p>

      <TaskUploadClient
        taskId={taskId}
        templateId={templateId}
        sectionLabel={sectionLabel}
        submissions={submissionsWithUrls}
      />
    </div>
  );
}
