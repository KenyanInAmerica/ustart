import { render, screen } from "@testing-library/react";
import { TaskUploadClient } from "@/components/documents/TaskUploadClient";
import type { DocumentSubmission } from "@/lib/types/documents";

jest.mock("../../../components/documents/DocumentUpload", () => ({
  DocumentUpload: () => <div data-testid="document-upload-stub" />,
}));

jest.mock("../../../components/documents/SubmissionCard", () => ({
  SubmissionCard: ({
    submission,
    isLatest,
  }: {
    submission: { id: string };
    isLatest?: boolean;
  }) => (
    <div data-testid="submission-card">
      {submission.id}:{isLatest === false ? "history" : "latest"}
    </div>
  ),
}));

function makeSubmission(
  id: string,
  createdAt: string,
  status: DocumentSubmission["status"] = "pending_review"
): DocumentSubmission {
  return {
    id,
    user_id: "user-1",
    task_id: "task-1",
    template_id: "template-1",
    section_label: "Banking",
    status,
    admin_comment: null,
    reviewed_by: null,
    reviewed_at: null,
    created_at: createdAt,
    updated_at: createdAt,
    files: [],
  };
}

describe("TaskUploadClient", () => {
  it("renders only the newest submission as actionable and groups older versions", () => {
    render(
      <TaskUploadClient
        taskId="task-1"
        templateId="template-1"
        sectionLabel="Banking"
        submissions={[
          makeSubmission("submission-old", "2026-06-01T00:00:00.000Z"),
          makeSubmission("submission-new", "2026-06-02T00:00:00.000Z"),
        ]}
      />
    );

    expect(screen.getByText("1 previous submission")).toBeInTheDocument();
    expect(screen.getAllByTestId("submission-card")[0]).toHaveTextContent(
      "submission-new:latest"
    );
    expect(screen.getAllByTestId("submission-card")[1]).toHaveTextContent(
      "submission-old:history"
    );
    expect(screen.getByTestId("document-upload-stub")).toBeInTheDocument();
  });
});
