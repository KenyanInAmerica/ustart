/** @jest-environment node */

const mockServiceFrom = jest.fn();

jest.mock("../../../lib/supabase/service", () => ({
  createServiceClient: jest.fn(() => ({
    from: mockServiceFrom,
  })),
}));

jest.mock("react", () => ({
  ...jest.requireActual("react"),
  cache: (fn: unknown) => fn,
}));

import { fetchUserDocumentSubmissions } from "../../../lib/admin/data";

function makeChain(returnValue: unknown): Record<string, unknown> {
  const promise = Promise.resolve(returnValue);
  const chain: Record<string, unknown> = {
    then: promise.then.bind(promise),
    catch: promise.catch.bind(promise),
  };
  const fn: jest.Mock = jest.fn(() => chain);
  chain.select = fn;
  chain.eq = fn;
  chain.in = fn;
  chain.order = fn;
  return chain;
}

describe("admin data document helpers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches document submissions for a user with nested files", async () => {
    mockServiceFrom.mockReturnValueOnce(
      makeChain({
        data: [
          {
            id: "submission-1",
            user_id: "user-1",
            task_id: "task-1",
            template_id: "template-1",
            section_label: "I-20",
            status: "pending_review",
            admin_comment: null,
            reviewed_by: null,
            reviewed_at: null,
            created_at: "2026-06-01T00:00:00.000Z",
            updated_at: "2026-06-01T00:00:00.000Z",
          },
        ],
        error: null,
      })
    ).mockReturnValueOnce(
      makeChain({
        data: [
          {
            id: "file-1",
            submission_id: "submission-1",
            file_name: "i20.pdf",
            file_path: "user-1/submission-1/i20.pdf",
            file_type: "application/pdf",
            file_size: 10,
            created_at: "2026-06-01T00:00:00.000Z",
          },
        ],
        error: null,
      })
    );

    const result = await fetchUserDocumentSubmissions("user-1");

    expect(result).toHaveLength(1);
    expect(result[0].files).toHaveLength(1);
    expect(mockServiceFrom).toHaveBeenCalledWith("document_submissions");
    expect(mockServiceFrom).toHaveBeenCalledWith("document_submission_files");
  });
});
