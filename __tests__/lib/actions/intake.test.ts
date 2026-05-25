/** @jest-environment node */

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

const mockGetUser = jest.fn();
const mockProfileMaybeSingle = jest.fn();
const mockIntakeInsert = jest.fn();
const mockIntakeUpdateEq = jest.fn();
const mockIntakeUpdate = jest.fn(() => ({ eq: mockIntakeUpdateEq }));
const mockServiceUpdateEq = jest.fn();
const mockServiceUpdate = jest.fn();
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
      update: mockIntakeUpdate,
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
      update: mockServiceUpdate,
    })),
  })),
}));

jest.mock("../../../lib/actions/plan", () => ({
  instantiatePlan: jest.fn(),
}));

// HubSpot tracking is fire-and-forget — mock to prevent console noise in tests.
jest.mock("../../../lib/hubspot/contacts", () => ({
  trackHubSpotContact: jest.fn(),
  toHubSpotDate: jest.fn(),
}));
jest.mock("../../../lib/hubspot/client", () => ({
  getHubSpotEnvironment: jest.fn(() => "staging"),
}));

import { revalidatePath } from "next/cache";
import { instantiatePlan } from "../../../lib/actions/plan";
import { submitIntake, updateIntake } from "../../../lib/actions/intake";

const validPayload = {
  school: "University of Michigan",
  city: "Ann Arbor, MI",
  arrival_date: "2099-09-01",
  graduation_date: "1_to_2_years",
  main_concerns: ["banking_credit", "other"],
  other_concern: "Understanding local banking setup",
};

describe("submitIntake", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockServiceUpdate.mockReturnValue({ eq: mockServiceUpdateEq });
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "student@example.com" } },
    });
    mockProfileMaybeSingle.mockResolvedValue({
      data: { intake_completed_at: null },
      error: null,
    });
    mockIntakeInsert.mockResolvedValue({ error: null });
    mockServiceUpdateEq.mockResolvedValue({ error: null });
    (instantiatePlan as jest.Mock).mockResolvedValue({ success: true, taskCount: 2 });
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

  it("returns an error when city is missing", async () => {
    const result = await submitIntake({ ...validPayload, city: "   " });
    expect(result).toEqual({ success: false, error: "City is required." });
  });

  it("returns an error when arrival_date is not a valid date", async () => {
    const result = await submitIntake({ ...validPayload, arrival_date: "not-a-date" });
    expect(result).toEqual({ success: false, error: "Arrival date is invalid." });
  });

  it("returns an error when graduation_date is not a valid timeline value", async () => {
    const result = await submitIntake({ ...validPayload, graduation_date: "not-a-timeline" });
    expect(result).toEqual({ success: false, error: "Graduation timeline is invalid." });
  });

  it("returns an error when no main_concerns are selected", async () => {
    const result = await submitIntake({ ...validPayload, main_concerns: [] });
    expect(result).toEqual({
      success: false,
      error: "Please select at least one main concern.",
    });
  });

  it("returns an error when main_concerns contains an unrecognised key", async () => {
    const result = await submitIntake({
      ...validPayload,
      main_concerns: ["not_a_valid_concern"],
    });
    expect(result).toEqual({
      success: false,
      error: "Main concerns include an invalid option.",
    });
  });

  it("returns an error when the profile select fails", async () => {
    mockProfileMaybeSingle.mockResolvedValue({
      data: null,
      error: { message: "select error" },
    });

    const result = await submitIntake(validPayload);

    expect(result).toEqual({ success: false, error: "select error" });
    expect(mockIntakeInsert).not.toHaveBeenCalled();
  });

  it("allows a past arrival date as long as it is valid", async () => {
    const result = await submitIntake({
      ...validPayload,
      arrival_date: "2024-09-01",
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
        graduation_date: "1_to_2_years",
        main_concerns:
          "banking_credit,other: Understanding local banking setup",
      })
    );
    expect(mockServiceUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        university_name: "University of Michigan",
        school: "University of Michigan",
        city: "Ann Arbor, MI",
        arrival_date: "2099-09-01",
        graduation_date: "1_to_2_years",
      })
    );
    expect(mockServiceUpdateEq).toHaveBeenCalledWith("id", "user-1");
    expect(instantiatePlan).toHaveBeenCalledWith("user-1");
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

describe("updateIntake", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "student@example.com" } },
    });
    mockProfileMaybeSingle.mockResolvedValue({
      data: { arrival_date: "2026-01-01" },
      error: null,
    });
    mockServiceUpdate.mockReturnValue({ eq: mockServiceUpdateEq });
    mockServiceUpdateEq.mockResolvedValue({ error: null });
    mockIntakeUpdateEq.mockResolvedValue({ error: null });
  });

  it("returns an error when the user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const result = await updateIntake({ school: "MIT" });
    expect(result).toEqual({ success: false, error: "Not authenticated." });
  });

  it("returns an error when the profile fetch fails", async () => {
    mockProfileMaybeSingle.mockResolvedValue({
      data: null,
      error: { message: "fetch error" },
    });
    const result = await updateIntake({ school: "MIT" });
    expect(result).toEqual({ success: false, error: "fetch error" });
  });

  it("returns success with arrivalDateChanged false when arrival_date is not provided", async () => {
    const result = await updateIntake({ school: "MIT" });
    expect(result).toEqual({ success: true, arrivalDateChanged: false });
  });

  it("returns success with arrivalDateChanged true when arrival_date changes", async () => {
    const result = await updateIntake({ arrival_date: "2099-09-01" });
    expect(result).toEqual({ success: true, arrivalDateChanged: true });
  });

  it("returns arrivalDateChanged false when arrival_date is provided but matches current", async () => {
    const result = await updateIntake({ arrival_date: "2026-01-01" });
    expect(result).toEqual({ success: true, arrivalDateChanged: false });
  });

  it("returns an error when school is blank", async () => {
    const result = await updateIntake({ school: "   " });
    expect(result).toEqual({ success: false, error: "School is required." });
  });

  it("returns an error when city is blank", async () => {
    const result = await updateIntake({ city: "   " });
    expect(result).toEqual({ success: false, error: "City is required." });
  });

  it("returns an error when arrival_date is not a valid date", async () => {
    const result = await updateIntake({ arrival_date: "not-a-date" });
    expect(result).toEqual({ success: false, error: "Arrival date is invalid." });
  });

  it("returns an error when graduation_date is not a valid timeline value", async () => {
    const result = await updateIntake({ graduation_date: "not-a-timeline" });
    expect(result).toEqual({ success: false, error: "Graduation timeline is invalid." });
  });

  it("returns an error when no main_concerns are selected", async () => {
    const result = await updateIntake({ main_concerns: [] });
    expect(result).toEqual({
      success: false,
      error: "Please select at least one main concern.",
    });
  });

  it("returns an error when main_concerns contains an invalid key", async () => {
    const result = await updateIntake({ main_concerns: ["not_a_valid_concern"] });
    expect(result).toEqual({
      success: false,
      error: "Main concerns include an invalid option.",
    });
  });

  it("returns an error when other is selected but other_concern is blank", async () => {
    const result = await updateIntake({
      main_concerns: ["other"],
      other_concern: "   ",
    });
    expect(result).toEqual({
      success: false,
      error: "Please tell us more about your other concern.",
    });
  });

  it("returns an error when the profile update fails", async () => {
    mockServiceUpdateEq.mockResolvedValue({
      error: { message: "profile update failed" },
    });
    const result = await updateIntake({ school: "MIT" });
    expect(result).toEqual({ success: false, error: "profile update failed" });
  });

  it("returns an error when the intake_responses update fails", async () => {
    mockIntakeUpdateEq.mockResolvedValue({
      error: { message: "intake update failed" },
    });
    const result = await updateIntake({ main_concerns: ["banking_credit"] });
    expect(result).toEqual({ success: false, error: "intake update failed" });
  });

  it("revalidates the account path on success", async () => {
    await updateIntake({ school: "MIT" });
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard/account");
  });

  it("returns a generic error when an unexpected exception is thrown", async () => {
    mockGetUser.mockRejectedValue(new Error("boom"));
    const result = await updateIntake({ school: "MIT" });
    expect(result).toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
  });
});
