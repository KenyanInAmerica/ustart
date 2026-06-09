import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DocumentSubmissionsQueue } from "@/components/admin/DocumentSubmissionsQueue";
import type { AdminDocumentSubmission } from "@/lib/admin/data";

jest.mock("../../../lib/actions/admin/documents", () => ({
  adminReviewSubmission: jest.fn(),
}));

import { adminReviewSubmission } from "../../../lib/actions/admin/documents";

const submission: AdminDocumentSubmission = {
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
  student_first_name: "Alice",
  student_last_name: "Smith",
  student_email: "alice@test.com",
  files: [
    {
      id: "file-1",
      submission_id: "submission-1",
      file_name: "bank.pdf",
      file_path: "user-1/submission-1/bank.pdf",
      file_type: "application/pdf",
      file_size: 100,
      created_at: "2026-06-01T00:00:00.000Z",
      signedUrl: "https://signed.test/bank.pdf",
    },
  ],
};

describe("DocumentSubmissionsQueue", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (adminReviewSubmission as jest.Mock).mockResolvedValue({ success: true });
  });

  it("renders submission details and file links", () => {
    render(<DocumentSubmissionsQueue submissions={[submission]} />);

    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    expect(screen.getByText("alice@test.com")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /bank.pdf/i })).toHaveAttribute(
      "href",
      "https://signed.test/bank.pdf"
    );
  });

  it("approves a submission", async () => {
    render(<DocumentSubmissionsQueue submissions={[submission]} />);

    expect(
      screen.getByPlaceholderText(/optional for approval, required for resubmission/i)
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /approve/i }));

    await waitFor(() =>
      expect(adminReviewSubmission).toHaveBeenCalledWith("submission-1", {
        status: "approved",
        comment: "",
      })
    );
  });

  it("disables approve when a submission is already approved", () => {
    render(
      <DocumentSubmissionsQueue
        submissions={[{ ...submission, status: "approved" }]}
      />
    );

    const approveButton = screen.getByRole("button", { name: /approve/i });
    const resubmitButton = screen.getByRole("button", {
      name: /request resubmit/i,
    });

    expect(approveButton).toBeDisabled();
    expect(resubmitButton).toBeEnabled();

    fireEvent.click(approveButton);

    expect(adminReviewSubmission).not.toHaveBeenCalled();
  });

  it("disables request resubmit when resubmission is already requested", () => {
    render(
      <DocumentSubmissionsQueue
        submissions={[{ ...submission, status: "resubmit_requested" }]}
      />
    );

    const approveButton = screen.getByRole("button", { name: /approve/i });
    const resubmitButton = screen.getByRole("button", {
      name: /request resubmit/i,
    });

    expect(approveButton).toBeEnabled();
    expect(resubmitButton).toBeDisabled();

    fireEvent.click(resubmitButton);

    expect(adminReviewSubmission).not.toHaveBeenCalled();
  });

  it("groups previous versions behind the latest and only renders review controls for the latest", () => {
    const latestSubmission: AdminDocumentSubmission = {
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
    };
    const previousSubmission: AdminDocumentSubmission = {
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
    };

    render(
      <DocumentSubmissionsQueue
        submissions={[previousSubmission, latestSubmission]}
      />
    );

    expect(screen.getByText("1 previous version")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /new-bank.pdf/i })).toBeInTheDocument();
    fireEvent.click(screen.getByText("1 previous version"));
    expect(screen.getByRole("link", { name: /old-bank.pdf/i })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /approve/i })).toHaveLength(1);
    expect(
      screen.getAllByRole("button", { name: /request resubmit/i })
    ).toHaveLength(1);
    expect(screen.getByRole("button", { name: /approve/i })).toBeDisabled();
  });

  it("filters groups by latest submission status", () => {
    const latestSubmission: AdminDocumentSubmission = {
      ...submission,
      id: "submission-new",
      status: "approved",
      created_at: "2026-06-02T00:00:00.000Z",
    };
    const previousSubmission: AdminDocumentSubmission = {
      ...submission,
      id: "submission-old",
      status: "pending_review",
      created_at: "2026-06-01T00:00:00.000Z",
    };

    const { rerender } = render(
      <DocumentSubmissionsQueue
        submissions={[previousSubmission, latestSubmission]}
        activeFilter="pending_review"
      />
    );

    expect(screen.getByText(/no document submissions match/i)).toBeInTheDocument();

    rerender(
      <DocumentSubmissionsQueue
        submissions={[previousSubmission, latestSubmission]}
        activeFilter="approved"
      />
    );

    expect(screen.getByText("Alice Smith")).toBeInTheDocument();
    expect(screen.getByText("1 previous version")).toBeInTheDocument();
  });

  it("renders empty state", () => {
    render(<DocumentSubmissionsQueue submissions={[]} />);

    expect(screen.getByText(/no document submissions match/i)).toBeInTheDocument();
  });

  it("syncs rows when filtered submissions change", () => {
    const { rerender } = render(<DocumentSubmissionsQueue submissions={[submission]} />);

    expect(screen.getByText("Alice Smith")).toBeInTheDocument();

    rerender(<DocumentSubmissionsQueue submissions={[]} />);

    expect(screen.queryByText("Alice Smith")).not.toBeInTheDocument();
    expect(screen.getByText(/no document submissions match/i)).toBeInTheDocument();
  });
});
