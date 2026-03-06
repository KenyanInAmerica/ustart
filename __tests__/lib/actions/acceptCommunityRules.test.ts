/** @jest-environment node */

// acceptCommunityRules is a Server Action — test in the node environment so
// "use server" doesn't cause issues with the jsdom environment.

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

const mockUpdateEq = jest.fn();
const mockUpsert = jest.fn();
const mockGetUser = jest.fn();

// The mock returns an object with both `update` and `upsert` so it handles
// both the profiles update and the community_agreements upsert.
jest.mock("../../../lib/supabase/server", () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
    from: jest.fn(() => ({
      update: jest.fn(() => ({
        eq: mockUpdateEq,
      })),
      upsert: mockUpsert,
    })),
  })),
}));

import { revalidatePath } from "next/cache";
import { acceptCommunityRules } from "../../../lib/actions/acceptCommunityRules";

describe("acceptCommunityRules", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (revalidatePath as jest.Mock).mockReset();
  });

  it("returns an error when the phone number is invalid", async () => {
    const result = await acceptCommunityRules("not-a-phone");
    expect(result).toEqual({
      success: false,
      error: expect.stringContaining("valid international number"),
    });
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it("returns an error when the phone number is missing the + prefix", async () => {
    const result = await acceptCommunityRules("12345678901");
    expect(result.success).toBe(false);
  });

  it("returns an error when there is no authenticated user", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const result = await acceptCommunityRules("+12345678901");
    expect(result).toEqual({ success: false, error: "Not authenticated." });
  });

  it("returns an error when the profiles update fails", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockUpdateEq.mockResolvedValue({ error: { message: "DB error" } });
    const result = await acceptCommunityRules("+12345678901");
    expect(result).toEqual({ success: false, error: "DB error" });
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("returns an error when the community_agreements upsert fails", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockUpdateEq.mockResolvedValue({ error: null });
    mockUpsert.mockResolvedValue({ error: { message: "Upsert error" } });
    const result = await acceptCommunityRules("+12345678901");
    expect(result).toEqual({ success: false, error: "Upsert error" });
  });

  it("returns { success: true } and revalidates the dashboard on success", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockUpdateEq.mockResolvedValue({ error: null });
    mockUpsert.mockResolvedValue({ error: null });
    const result = await acceptCommunityRules("+12345678901");
    expect(result).toEqual({ success: true });
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
  });

  it("returns a generic error when an unexpected exception is thrown", async () => {
    mockGetUser.mockRejectedValue(new Error("Network failure"));
    const result = await acceptCommunityRules("+12345678901");
    expect(result).toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
  });
});
