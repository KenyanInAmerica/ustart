/** @jest-environment node */

// trackContentVisit is a Server Action — test in the node environment so
// "use server" doesn't cause issues with the jsdom environment.

// jest.mock is hoisted before const declarations, so jest.fn() must be
// used inline here. The imported `revalidatePath` reference will be the mock.
jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

const mockUpdate = jest.fn();
const mockMaybeSingle = jest.fn();
const mockGetUser = jest.fn();

jest.mock("../../../lib/supabase/server", () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          maybeSingle: mockMaybeSingle,
        })),
      })),
      update: jest.fn(() => ({
        eq: mockUpdate,
      })),
    })),
  })),
}));

import { revalidatePath } from "next/cache";
import { trackContentVisit } from "../../../lib/actions/trackContentVisit";

describe("trackContentVisit", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the revalidatePath mock between tests (clearAllMocks handles jest.fn()
    // created via const, but the imported mock needs an explicit reset).
    (revalidatePath as jest.Mock).mockReset();
  });

  it("returns early when there is no authenticated user", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    await trackContentVisit();
    expect(mockMaybeSingle).not.toHaveBeenCalled();
  });

  it("returns early when first_content_visit_at is already set", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-123" } } });
    mockMaybeSingle.mockResolvedValue({
      data: { first_content_visit_at: "2024-01-01T00:00:00.000Z" },
    });
    await trackContentVisit();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("calls update and revalidatePath when first_content_visit_at is null", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-123" } } });
    mockMaybeSingle.mockResolvedValue({
      data: { first_content_visit_at: null },
    });
    mockUpdate.mockResolvedValue({ error: null });
    await trackContentVisit();
    expect(mockUpdate).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
  });

  it("calls update and revalidatePath when no profile row exists (null data)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-123" } } });
    mockMaybeSingle.mockResolvedValue({ data: null });
    mockUpdate.mockResolvedValue({ error: null });
    await trackContentVisit();
    expect(mockUpdate).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
  });

  it("does not call revalidatePath when first_content_visit_at is already set", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-123" } } });
    mockMaybeSingle.mockResolvedValue({
      data: { first_content_visit_at: "2024-01-01T00:00:00.000Z" },
    });
    await trackContentVisit();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("swallows errors silently and does not throw", async () => {
    mockGetUser.mockRejectedValue(new Error("Supabase down"));
    await expect(trackContentVisit()).resolves.toBeUndefined();
  });
});
