import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DocumentReviewSection } from "@/components/admin/DocumentReviewSection";

jest.mock("../../../lib/actions/admin/documents", () => ({
  adminFetchUserDocumentSubmissions: jest.fn(),
  adminReviewSubmission: jest.fn(),
}));

jest.mock("../../../lib/actions/documents", () => ({
  getSubmissionDownloadUrl: jest.fn(),
}));

import {
  adminFetchUserDocumentSubmissions,
  adminReviewSubmission,
} from "../../../lib/actions/admin/documents";
import { getSubmissionDownloadUrl } from "../../../lib/actions/documents";

const submission = {
  id: "submission-1",
  user_id: "user-1",
  task_id: null,
  template_id: null,
  section_label: "Banking",
  status: "pending_review",
  admin_comment: null,
  reviewed_by: null,
  reviewed_at: null,
  created_at: "2026-06-01T00:00:00.000Z",
  updated_at: "2026-06-01T00:00:00.000Z",
  files: [
    {
      id: "file-1",
      submission_id: "submission-1",
      file_name: "bank.pdf",
      file_path: "user-1/submission-1/bank.pdf",
      file_type: "application/pdf",
      file_size: 100,
      created_at: "2026-06-01T00:00:00.000Z",
    },
  ],
} as const;

describe("DocumentReviewSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (adminFetchUserDocumentSubmissions as jest.Mock).mockResolvedValue([submission]);
    (adminReviewSubmission as jest.Mock).mockResolvedValue({ success: true });
    (getSubmissionDownloadUrl as jest.Mock).mockResolvedValue("https://signed.test/file");
  });

  it("loads and renders user submissions", async () => {
    const onPendingCountChange = jest.fn();
    render(
      <DocumentReviewSection
        userId="user-1"
        userName="Alice"
        onPendingCountChange={onPendingCountChange}
      />
    );

    expect(await screen.findByText("Banking")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /download/i })).toHaveAttribute(
      "href",
      "https://signed.test/file"
    );
    expect(onPendingCountChange).toHaveBeenCalledWith(1);
  });

  it("submits an approval review", async () => {
    render(<DocumentReviewSection userId="user-1" userName="Alice" />);

    fireEvent.click(await screen.findByRole("button", { name: /save review/i }));

    await waitFor(() =>
      expect(adminReviewSubmission).toHaveBeenCalledWith("submission-1", {
        status: "approved",
        comment: "",
      })
    );
  });

  it("groups older versions behind the latest and only reviews the latest", async () => {
    (adminFetchUserDocumentSubmissions as jest.Mock).mockResolvedValueOnce([
      {
        ...submission,
        id: "submission-old",
        status: "pending_review",
        created_at: "2026-06-01T00:00:00.000Z",
        files: [
          {
            ...submission.files[0],
            id: "file-old",
            submission_id: "submission-old",
            file_name: "old-bank.pdf",
          },
        ],
      },
      {
        ...submission,
        id: "submission-new",
        status: "approved",
        created_at: "2026-06-02T00:00:00.000Z",
        files: [
          {
            ...submission.files[0],
            id: "file-new",
            submission_id: "submission-new",
            file_name: "new-bank.pdf",
          },
        ],
      },
    ]);
    const onPendingCountChange = jest.fn();

    render(
      <DocumentReviewSection
        userId="user-1"
        userName="Alice"
        onPendingCountChange={onPendingCountChange}
      />
    );

    expect(await screen.findByText("new-bank.pdf")).toBeInTheDocument();
    expect(screen.getByText("1 previous version")).toBeInTheDocument();
    fireEvent.click(screen.getByText("1 previous version"));
    expect(screen.getByText("old-bank.pdf")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /download/i })).toHaveLength(2);
    expect(screen.getByRole("button", { name: /update review/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /save review/i })).not.toBeInTheDocument();
    expect(onPendingCountChange).toHaveBeenCalledWith(0);
  });

  it("renders the empty state", async () => {
    (adminFetchUserDocumentSubmissions as jest.Mock).mockResolvedValueOnce([]);

    render(<DocumentReviewSection userId="user-1" userName="Alice" />);

    expect(
      await screen.findByText(/no document submissions from alice yet/i)
    ).toBeInTheDocument();
  });
});
