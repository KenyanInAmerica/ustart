/** @jest-environment node */

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

const mockGetUser = jest.fn();
const mockProfileMaybeSingle = jest.fn();
const mockIntakeInsert = jest.fn();
const mockServiceUpdateEq = jest.fn();
const mockServerFrom = jest.fn((table: string) => {
  if (table === "profiles") {
    return {
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          maybeSingle: mockProfileMaybeSingle,
        })),
      })),
    };
  }

  if (table === "intake_responses") {
    return {
      insert: mockIntakeInsert,
    };
  }

  throw new Error(`Unexpected table ${table}`);
});

jest.mock("../../../lib/supabase/server", () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockServerFrom,
  })),
}));

jest.mock("../../../lib/supabase/service", () => ({
  createServiceClient: jest.fn(() => ({
    from: jest.fn(() => ({
      update: jest.fn(() => ({
        eq: mockServiceUpdateEq,
      })),
    })),
  })),
}));

import { revalidatePath } from "next/cache";
import { submitIntake } from "../../../lib/actions/intake";

const validPayload = {
  school: "University of Michigan",
  city: "Ann Arbor, MI",
  arrival_date: "2099-09-01",
  graduation_date: "2103-05-15",
  main_concerns: ["banking_credit", "other"],
  other_concern: "Understanding local banking setup",
};

describe("submitIntake", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "student@example.com" } },
    });
    mockProfileMaybeSingle.mockResolvedValue({
      data: { intake_completed_at: null },
      error: null,
    });
    mockIntakeInsert.mockResolvedValue({ error: null });
    mockServiceUpdateEq.mockResolvedValue({ error: null });
  });

  it("returns an error when the user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const result = await submitIntake(validPayload);

    expect(result).toEqual({ success: false, error: "Not authenticated." });
  });

  it("returns an error when school is missing", async () => {
    const result = await submitIntake({ ...validPayload, school: "   " });
    expect(result).toEqual({ success: false, error: "School is required." });
  });

  it("allows a past arrival date as long as it is valid", async () => {
    const result = await submitIntake({
      ...validPayload,
      arrival_date: "2024-09-01",
      graduation_date: "2028-05-15",
    });

    expect(result).toEqual({ success: true });
  });

  it("requires other_concern when other is selected", async () => {
    const result = await submitIntake({
      ...validPayload,
      other_concern: "   ",
    });

    expect(result).toEqual({
      success: false,
      error: "Please tell us more about your other concern.",
    });
  });

  it("returns alreadyCompleted when the profile already has intake_completed_at", async () => {
    mockProfileMaybeSingle.mockResolvedValue({
      data: { intake_completed_at: "2026-04-21T00:00:00.000Z" },
      error: null,
    });

    const result = await submitIntake(validPayload);

    expect(result).toEqual({ success: true, alreadyCompleted: true });
    expect(mockIntakeInsert).not.toHaveBeenCalled();
    expect(mockServiceUpdateEq).not.toHaveBeenCalled();
  });

  it("writes intake_responses and updates the profile on success", async () => {
    const result = await submitIntake(validPayload);

    expect(result).toEqual({ success: true });
    expect(mockIntakeInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1",
        school: "University of Michigan",
        city: "Ann Arbor, MI",
        arrival_date: "2099-09-01",
        graduation_date: "2103-05-15",
        main_concerns:
          "banking_credit,other: Understanding local banking setup",
      })
    );
    expect(mockServiceUpdateEq).toHaveBeenCalledWith("id", "user-1");
    expect(revalidatePath).toHaveBeenCalledWith("/intake");
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
  });

  it("returns an error when the intake insert fails", async () => {
    mockIntakeInsert.mockResolvedValue({
      error: { message: "insert failed" },
    });

    const result = await submitIntake(validPayload);

    expect(result).toEqual({ success: false, error: "insert failed" });
  });

  it("returns an error when the profile update fails", async () => {
    mockServiceUpdateEq.mockResolvedValue({
      error: { message: "update failed" },
    });

    const result = await submitIntake(validPayload);

    expect(result).toEqual({ success: false, error: "update failed" });
  });

  it("returns a generic error when an unexpected exception is thrown", async () => {
    mockGetUser.mockRejectedValue(new Error("boom"));

    const result = await submitIntake(validPayload);

    expect(result).toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
  });
});
