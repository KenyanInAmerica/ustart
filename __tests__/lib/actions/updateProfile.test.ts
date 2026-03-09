/** @jest-environment node */

// updateProfile is a Server Action — test in the node environment so
// "use server" doesn't cause issues with the jsdom environment.

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

const mockUpdateEq = jest.fn();
const mockGetUser = jest.fn();

jest.mock("../../../lib/supabase/server", () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
    from: jest.fn(() => ({
      update: jest.fn(() => ({ eq: mockUpdateEq })),
    })),
  })),
}));

import { revalidatePath } from "next/cache";
import { updateProfile } from "../../../lib/actions/updateProfile";

describe("updateProfile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (revalidatePath as jest.Mock).mockReset();
  });

  it("returns an error when there is no authenticated user", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const result = await updateProfile({ first_name: "Test" });
    expect(result).toEqual({ success: false, error: "Not authenticated." });
  });

  it("returns { success: true } when nothing changes (empty input)", async () => {
    // No user call needed since we return early before auth when input is empty
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const result = await updateProfile({});
    expect(result).toEqual({ success: true });
    expect(mockUpdateEq).not.toHaveBeenCalled();
  });

  it("validates phone_number and returns an error for an invalid format", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const result = await updateProfile({ phone_number: "not-a-phone" });
    expect(result).toEqual({
      success: false,
      error: expect.stringContaining("valid international number"),
    });
    expect(mockUpdateEq).not.toHaveBeenCalled();
  });

  it("strips spaces from phone_number before validating", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockUpdateEq.mockResolvedValue({ error: null });
    // "+1 234 567 8900" → "+12345678900" after stripping — valid
    const result = await updateProfile({ phone_number: "+1 234 567 8900" });
    expect(result).toEqual({ success: true });
  });

  it("allows clearing phone_number with an empty string", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockUpdateEq.mockResolvedValue({ error: null });
    const result = await updateProfile({ phone_number: "" });
    expect(result).toEqual({ success: true });
  });

  it("returns an error when the profiles update fails", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockUpdateEq.mockResolvedValue({ error: { message: "DB error" } });
    const result = await updateProfile({ first_name: "Test" });
    expect(result).toEqual({ success: false, error: "DB error" });
  });

  it("returns { success: true } and revalidates both paths on success", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockUpdateEq.mockResolvedValue({ error: null });
    const result = await updateProfile({ first_name: "Test", last_name: "User", university_name: "MIT" });
    expect(result).toEqual({ success: true });
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard/account");
  });

  it("returns a generic error when an unexpected exception is thrown", async () => {
    mockGetUser.mockRejectedValue(new Error("Network failure"));
    const result = await updateProfile({ first_name: "Test" });
    expect(result).toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
  });
});
