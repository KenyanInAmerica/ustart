import { fireEvent, render, screen } from "@testing-library/react";
import { SubmissionCard } from "@/components/documents/SubmissionCard";
import type { DocumentSubmission } from "@/lib/types/documents";

jest.mock("../../../components/documents/DocumentUpload", () => ({
  DocumentUpload: () => <div data-testid="document-upload-stub" />,
}));

const submission: DocumentSubmission = {
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
  files: [
    {
      id: "file-1",
      submission_id: "submission-1",
      file_name: "bank.pdf",
      file_path: "user-1/submission-1/bank.pdf",
      file_type: "application/pdf",
      file_size: 1024,
      created_at: "2026-06-01T00:00:00.000Z",
      signedUrl: "https://signed.test/bank.pdf",
    },
  ],
};

describe("SubmissionCard", () => {
  it("renders submission details and download link", () => {
    render(<SubmissionCard submission={submission} />);

    expect(screen.queryByRole("heading", { name: "Banking" })).not.toBeInTheDocument();
    expect(screen.getByText("Pending Review")).toBeInTheDocument();
    expect(screen.getByText("May 31, 2026")).toBeInTheDocument();
    expect(screen.getByText("bank.pdf")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /download/i })).toHaveAttribute(
      "href",
      "https://signed.test/bank.pdf"
    );
  });

  it("renders the title when showTitle is true", () => {
    render(<SubmissionCard submission={submission} showTitle />);

    expect(screen.getByRole("heading", { name: "Banking" })).toBeInTheDocument();
  });

  it("shows reviewer comments", () => {
    render(
      <SubmissionCard
        submission={{
          ...submission,
          status: "resubmit_requested",
          admin_comment: "Please upload a clearer copy.",
        }}
      />
    );

    expect(screen.getByText("Reviewer comment")).toBeInTheDocument();
    expect(screen.getByText(/please upload a clearer copy/i)).toBeInTheDocument();
  });

  it("opens resubmission upload UI", () => {
    render(
      <SubmissionCard
        submission={{
          ...submission,
          status: "resubmit_requested",
        }}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /upload new version/i }));

    expect(screen.getByTestId("document-upload-stub")).toBeInTheDocument();
  });

  it("renders history cards without the upload new version action", () => {
    render(
      <SubmissionCard
        submission={{
          ...submission,
          status: "resubmit_requested",
        }}
        isLatest={false}
      />
    );

    expect(screen.getByText("Resubmit Requested")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /download/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /upload new version/i })
    ).not.toBeInTheDocument();
  });

  it("renders cancelled status", () => {
    render(
      <SubmissionCard
        submission={{
          ...submission,
          status: "cancelled",
        }}
      />
    );

    expect(screen.getByText("Cancelled")).toBeInTheDocument();
  });
});
