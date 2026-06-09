/** @jest-environment node */

const mockGetUser = jest.fn();
const mockServiceFrom = jest.fn();

jest.mock("../../../../lib/supabase/server", () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
}));

jest.mock("../../../../lib/supabase/service", () => ({
  createServiceClient: jest.fn(() => ({
    from: mockServiceFrom,
  })),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

jest.mock("../../../../lib/resend/client", () => ({
  resend: { emails: { send: jest.fn() } },
}));

jest.mock("../../../../lib/audit/log", () => ({
  logAction: jest.fn(),
}));

jest.mock("react", () => ({
  ...jest.requireActual("react"),
  cache: (fn: unknown) => fn,
}));

import { adminReviewSubmission } from "../../../../lib/actions/admin/documents";
import { AuditAction } from "../../../../lib/audit/actions";
import { logAction } from "../../../../lib/audit/log";
import { resend } from "../../../../lib/resend/client";
import { revalidatePath } from "next/cache";

const mockLogAction = logAction as jest.Mock;
const mockSendEmail = resend.emails.send as jest.Mock;

function makeChain(returnValue: unknown): Record<string, unknown> {
  const promise = Promise.resolve(returnValue);
  const chain: Record<string, unknown> = {
    then: promise.then.bind(promise),
    catch: promise.catch.bind(promise),
  };
  const fn: jest.Mock = jest.fn(() => chain);
  chain.select = fn;
  chain.update = fn;
  chain.eq = fn;
  chain.maybeSingle = jest.fn().mockResolvedValue(returnValue);
  return chain;
}

const ADMIN_USER = { id: "admin-1", email: "admin@test.com" };

describe("admin document actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSendEmail.mockResolvedValue({ data: { id: "email-1" }, error: null });
  });

  it("rejects unauthenticated review requests", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const result = await adminReviewSubmission("submission-1", {
      status: "approved",
    });

    expect(result).toEqual({ success: false, error: "Not authenticated." });
  });

  it("requires a comment when requesting resubmission", async () => {
    mockGetUser.mockResolvedValue({ data: { user: ADMIN_USER } });
    mockServiceFrom.mockReturnValueOnce(
      makeChain({ data: { is_admin: true }, error: null })
    );

    const result = await adminReviewSubmission("submission-1", {
      status: "resubmit_requested",
      comment: " ",
    });

    expect(result).toEqual({
      success: false,
      error: "A comment is required when requesting resubmission.",
    });
  });

  it("reviews a submission, emails the student, and logs the action", async () => {
    mockGetUser.mockResolvedValue({ data: { user: ADMIN_USER } });
    mockServiceFrom
      .mockReturnValueOnce(makeChain({ data: { is_admin: true }, error: null }))
      .mockReturnValueOnce(
        makeChain({
          data: {
            id: "submission-1",
            user_id: "student-1",
            section_label: "Bank statement",
          },
          error: null,
        })
      )
      .mockReturnValueOnce(makeChain({ error: null }))
      .mockReturnValueOnce(
        makeChain({
          data: {
            email: "student@test.com",
            first_name: "Student",
            last_name: "One",
          },
          error: null,
        })
      );

    const result = await adminReviewSubmission("submission-1", {
      status: "approved",
    });

    expect(result).toEqual({ success: true });
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "student@test.com",
        subject: "Your document has been approved",
      })
    );
    expect(mockLogAction).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AuditAction.ADMIN_DOCUMENT_REVIEWED,
        targetId: "student-1",
      })
    );
    expect(revalidatePath).toHaveBeenCalledWith("/admin/users");
    expect(revalidatePath).toHaveBeenCalledWith("/admin/documents");
  });
});
