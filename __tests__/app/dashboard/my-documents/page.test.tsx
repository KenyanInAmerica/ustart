import { render, screen } from "@testing-library/react";
import MyDocumentsPage from "@/app/dashboard/my-documents/page";

const mockGetUser = jest.fn();
const mockMaybeSingle = jest.fn();

jest.mock("../../../../lib/supabase/server", () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          maybeSingle: mockMaybeSingle,
        })),
      })),
    })),
  })),
}));

jest.mock("../../../../lib/dashboard/content", () => ({
  fetchUserDocuments: jest.fn().mockResolvedValue([]),
}));

jest.mock("../../../../lib/actions/documents", () => ({
  fetchUserSubmissions: jest.fn().mockResolvedValue([]),
  fetchSubmissionFiles: jest.fn().mockResolvedValue([]),
}));

jest.mock("../../../../components/dashboard/ContentGrid", () => ({
  ContentGrid: () => <div data-testid="content-grid-stub" />,
}));

jest.mock("../../../../components/documents/GeneralUploadLauncher", () => ({
  GeneralUploadLauncher: ({
    initialOpen,
    taskId,
    sectionLabel,
  }: {
    initialOpen?: boolean;
    taskId?: string;
    sectionLabel?: string;
  }) => (
    <button>
      Upload a document {initialOpen ? "open" : "closed"} {taskId} {sectionLabel}
    </button>
  ),
}));

jest.mock("../../../../components/documents/SubmissionCard", () => ({
  SubmissionCard: ({
    submission,
    isLatest,
    showTitle,
  }: {
    submission: { id: string; section_label: string | null };
    isLatest?: boolean;
    showTitle?: boolean;
  }) => (
    <div data-testid="submission-card">
      {submission.id}:{submission.section_label ?? "General"}:
      {isLatest === false ? "history" : "latest"}:
      {showTitle ? "show-title" : "hide-title"}
    </div>
  ),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

import { redirect } from "next/navigation";
import {
  fetchSubmissionFiles,
  fetchUserSubmissions,
} from "../../../../lib/actions/documents";

describe("MyDocumentsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "test@example.com" } },
    });
    mockMaybeSingle.mockResolvedValue({
      data: { role: "student" },
    });
  });

  it("renders without error", async () => {
    const { container } = render(await MyDocumentsPage({}));
    expect(container).toBeTruthy();
  });

  it("renders assigned documents and submissions headings", async () => {
    render(await MyDocumentsPage({}));
    expect(screen.getByRole("heading", { name: /assigned documents/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /my submissions/i })).toBeInTheDocument();
  });

  it("renders the content grid", async () => {
    render(await MyDocumentsPage({}));
    expect(screen.getByTestId("content-grid-stub")).toBeInTheDocument();
  });

  it("renders the submissions empty state", async () => {
    render(await MyDocumentsPage({}));

    expect(screen.getByText(/you haven't submitted any documents yet/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /upload a document/i })).toBeInTheDocument();
  });

  it("passes upload query params to the upload launcher", async () => {
    render(
      await MyDocumentsPage({
        searchParams: {
          upload: "true",
          taskId: "task-1",
          label: "Open a bank account",
        },
      })
    );

    expect(
      screen.getByRole("button", {
        name: /upload a document open task-1 open a bank account/i,
      })
    ).toBeInTheDocument();
  });

  it("groups submissions by section label", async () => {
    (fetchUserSubmissions as jest.Mock).mockResolvedValueOnce([
      {
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
        files: [],
      },
    ]);
    (fetchSubmissionFiles as jest.Mock).mockResolvedValueOnce([]);

    render(await MyDocumentsPage({}));

    expect(screen.getByRole("heading", { name: /banking/i })).toBeInTheDocument();
    expect(screen.getByTestId("submission-card")).toHaveTextContent(
      "submission-1:Banking:latest:hide-title"
    );
  });

  it("groups multiple submissions for one task with previous history collapsed", async () => {
    (fetchUserSubmissions as jest.Mock).mockResolvedValueOnce([
      {
        id: "submission-old",
        user_id: "user-1",
        task_id: "task-1",
        template_id: null,
        section_label: "Banking",
        status: "approved",
        admin_comment: null,
        reviewed_by: null,
        reviewed_at: null,
        created_at: "2026-06-01T00:00:00.000Z",
        updated_at: "2026-06-01T00:00:00.000Z",
        files: [],
      },
      {
        id: "submission-new",
        user_id: "user-1",
        task_id: "task-1",
        template_id: null,
        section_label: "Banking",
        status: "pending_review",
        admin_comment: null,
        reviewed_by: null,
        reviewed_at: null,
        created_at: "2026-06-02T00:00:00.000Z",
        updated_at: "2026-06-02T00:00:00.000Z",
        files: [],
      },
    ]);
    (fetchSubmissionFiles as jest.Mock).mockResolvedValue([]);

    render(await MyDocumentsPage({}));

    expect(screen.getByText(/1 previous submission/i)).toBeInTheDocument();
    expect(screen.getAllByTestId("submission-card")[0]).toHaveTextContent(
      "submission-new:Banking:latest:hide-title"
    );
    expect(screen.getAllByTestId("submission-card")[1]).toHaveTextContent(
      "submission-old:Banking:history:hide-title"
    );
  });

  it("redirects parents to the parent dashboard", async () => {
    mockMaybeSingle.mockResolvedValue({ data: { role: "parent" } });

    await MyDocumentsPage({});

    expect(redirect).toHaveBeenCalledWith("/dashboard/parent/plan");
  });
});
