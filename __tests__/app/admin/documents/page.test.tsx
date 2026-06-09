import { render, screen } from "@testing-library/react";
import AdminDocumentsPage from "@/app/admin/documents/page";

jest.mock("../../../../lib/admin/data", () => ({
  fetchAdminDocumentSubmissions: jest.fn(),
}));

jest.mock("../../../../lib/actions/documents", () => ({
  getSubmissionDownloadUrl: jest.fn().mockResolvedValue("https://signed.test/file"),
}));

jest.mock("../../../../components/admin/DocumentSubmissionsQueue", () => ({
  DocumentSubmissionsQueue: ({
    submissions,
    activeFilter,
  }: {
    submissions: { id: string }[];
    activeFilter: string;
  }) => (
    <div data-testid="document-queue">
      {submissions.length}:{activeFilter}
    </div>
  ),
}));

import { fetchAdminDocumentSubmissions } from "../../../../lib/admin/data";

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
    },
  ],
};

describe("AdminDocumentsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetchAdminDocumentSubmissions as jest.Mock).mockResolvedValue([submission]);
  });

  it("renders heading, filters, and queue", async () => {
    render(await AdminDocumentsPage({ searchParams: {} }));

    expect(screen.getByRole("heading", { name: /document submissions/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^all$/i })).toHaveAttribute(
      "href",
      "/admin/documents"
    );
    expect(screen.getByTestId("document-queue")).toHaveTextContent("1:all");
  });

  it("passes the active status filter to the queue", async () => {
    render(
      await AdminDocumentsPage({
        searchParams: { status: "approved" },
      })
    );

    expect(screen.getByTestId("document-queue")).toHaveTextContent("1:approved");
  });
});
