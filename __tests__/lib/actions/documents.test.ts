/** @jest-environment node */

const mockGetUser = jest.fn();
const mockServerFrom = jest.fn();
const mockServiceFrom = jest.fn();
const mockStorageFrom = jest.fn();

jest.mock("../../../lib/supabase/server", () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockServerFrom,
  })),
}));

jest.mock("../../../lib/supabase/service", () => ({
  createServiceClient: jest.fn(() => ({
    from: mockServiceFrom,
    storage: { from: mockStorageFrom },
  })),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

jest.mock("../../../lib/resend/client", () => ({
  resend: { emails: { send: jest.fn() } },
}));

import {
  fetchSubmissionFiles,
  fetchUserSubmissions,
  getSubmissionDownloadUrl,
  submitDocument,
} from "../../../lib/actions/documents";
import { resend } from "../../../lib/resend/client";

const mockSendEmail = resend.emails.send as jest.Mock;

function makeChain(returnValue: unknown): Record<string, unknown> {
  const promise = Promise.resolve(returnValue);
  const chain: Record<string, unknown> = {
    then: promise.then.bind(promise),
    catch: promise.catch.bind(promise),
  };
  const fn: jest.Mock = jest.fn(() => chain);
  chain.select = fn;
  chain.insert = fn;
  chain.update = fn;
  chain.eq = fn;
  chain.neq = fn;
  chain.in = fn;
  chain.is = fn;
  chain.order = fn;
  chain.single = jest.fn().mockResolvedValue(returnValue);
  chain.maybeSingle = jest.fn().mockResolvedValue(returnValue);
  return chain;
}

function makeFormData(file: File): FormData {
  const formData = new FormData();
  formData.append("files", file);
  formData.append("taskId", "task-1");
  formData.append("templateId", "template-1");
  formData.append("sectionLabel", "I-20");
  return formData;
}

describe("document actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSendEmail.mockResolvedValue({ data: { id: "email-1" }, error: null });
  });

  it("rejects unauthenticated submissions", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const result = await submitDocument(
      makeFormData(new File(["x"], "test.pdf", { type: "application/pdf" }))
    );

    expect(result).toEqual({ success: false, error: "Not authenticated." });
  });

  it("validates required files", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "student@test.com" } },
    });

    const result = await submitDocument(new FormData());

    expect(result).toEqual({
      success: false,
      error: "At least one file is required.",
    });
  });

  it("creates a submission, uploads files, inserts file rows, and sends email", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "student@test.com" } },
    });
    mockServerFrom
      .mockReturnValueOnce(makeChain({ data: { id: "submission-1" }, error: null }))
      .mockReturnValueOnce(makeChain({ error: null }));
    mockStorageFrom.mockReturnValue({
      upload: jest.fn().mockResolvedValue({ data: {}, error: null }),
    });
    mockServiceFrom
      .mockReturnValueOnce(makeChain({ data: null, error: null }))
      .mockReturnValueOnce(
        makeChain({
          data: {
            first_name: "Randy",
            last_name: "Osoti",
            email: "student@test.com",
          },
          error: null,
        })
      )
      .mockReturnValueOnce(makeChain({ data: { title: "Upload I-20" }, error: null }));

    const result = await submitDocument(
      makeFormData(new File(["pdf"], "i20.pdf", { type: "application/pdf" }))
    );

    expect(result).toEqual({ success: true, submissionId: "submission-1" });
    expect(mockStorageFrom).toHaveBeenCalledWith("submissions");
    expect(mockServerFrom).toHaveBeenCalledWith("document_submission_files");
    expect(mockServiceFrom).toHaveBeenCalledWith("document_submissions");
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: "New document submission from Randy Osoti",
      })
    );
  });

  it("fetches submissions for the authenticated user", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "student@test.com" } },
    });
    mockServerFrom.mockReturnValueOnce(
      makeChain({
        data: [
          {
            id: "submission-1",
            user_id: "user-1",
            task_id: null,
            template_id: null,
            section_label: "General",
            status: "pending_review",
            admin_comment: null,
            reviewed_by: null,
            reviewed_at: null,
            created_at: "2026-06-01T00:00:00.000Z",
            updated_at: "2026-06-01T00:00:00.000Z",
            document_submission_files: [],
          },
        ],
        error: null,
      })
    );

    await expect(fetchUserSubmissions()).resolves.toHaveLength(1);
  });

  it("creates signed URLs for submission files", async () => {
    mockServiceFrom.mockReturnValueOnce(
      makeChain({
        data: [
          {
            id: "file-1",
            submission_id: "submission-1",
            file_name: "i20.pdf",
            file_path: "user-1/submission-1/i20.pdf",
            file_type: "application/pdf",
            file_size: 12,
            created_at: "2026-06-01T00:00:00.000Z",
          },
        ],
        error: null,
      })
    );
    mockStorageFrom.mockReturnValue({
      createSignedUrl: jest.fn().mockResolvedValue({
        data: { signedUrl: "https://signed.test/file" },
        error: null,
      }),
    });

    const files = await fetchSubmissionFiles("submission-1");

    expect(files[0].signedUrl).toBe("https://signed.test/file");
  });

  it("returns null when a signed URL cannot be created", async () => {
    mockStorageFrom.mockReturnValue({
      createSignedUrl: jest.fn().mockResolvedValue({
        data: null,
        error: { message: "storage error" },
      }),
    });

    await expect(getSubmissionDownloadUrl("missing.pdf")).resolves.toBeNull();
  });
});
