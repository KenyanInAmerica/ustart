import { render, screen } from "@testing-library/react";
import { TaskUploadSection } from "@/components/documents/TaskUploadSection";

jest.mock("../../../lib/actions/documents", () => ({
  fetchUserSubmissions: jest.fn(),
  fetchSubmissionFiles: jest.fn(),
}));

jest.mock("../../../components/documents/TaskUploadClient", () => ({
  TaskUploadClient: ({
    submissions,
  }: {
    submissions: { id: string }[];
  }) => (
    <div data-testid="task-upload-client">
      {submissions.map((submission) => (
        <span key={submission.id} data-testid="submission-card">
          {submission.id}
        </span>
      ))}
    </div>
  ),
}));

import {
  fetchSubmissionFiles,
  fetchUserSubmissions,
} from "../../../lib/actions/documents";

describe("TaskUploadSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetchUserSubmissions as jest.Mock).mockResolvedValue([]);
    (fetchSubmissionFiles as jest.Mock).mockResolvedValue([]);
  });

  it("renders upload guidance and upload UI", async () => {
    render(
      await TaskUploadSection({
        taskId: "task-1",
        templateId: "template-1",
        sectionLabel: "Banking",
        userId: "user-1",
      })
    );

    expect(screen.getByText(/document submission/i)).toBeInTheDocument();
    expect(screen.getByTestId("task-upload-client")).toBeInTheDocument();
  });

  it("renders existing submissions for the task", async () => {
    (fetchUserSubmissions as jest.Mock).mockResolvedValueOnce([
      {
        id: "submission-1",
        user_id: "user-1",
        task_id: "task-1",
        template_id: "template-1",
        section_label: "Banking",
        status: "pending_review",
        admin_comment: null,
        reviewed_by: null,
        reviewed_at: null,
        created_at: "2026-06-01T00:00:00.000Z",
        updated_at: "2026-06-01T00:00:00.000Z",
        files: [],
      },
    ]);

    render(
      await TaskUploadSection({
        taskId: "task-1",
        templateId: "template-1",
        sectionLabel: "Banking",
        userId: "user-1",
      })
    );

    expect(screen.getByTestId("submission-card")).toHaveTextContent("submission-1");
    expect(fetchSubmissionFiles).toHaveBeenCalledWith("submission-1");
  });
});
