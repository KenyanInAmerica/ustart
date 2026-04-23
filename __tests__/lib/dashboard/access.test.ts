/** @jest-environment node */

const mockGetUser = jest.fn();
const mockFrom = jest.fn();
const mockServiceFrom = jest.fn();

jest.mock("react", () => {
  const actual = jest.requireActual("react") as Record<string, unknown>;
  return {
    ...actual,
    cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
  };
});

jest.mock("../../../lib/supabase/server", () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}));

jest.mock("../../../lib/supabase/service", () => ({
  createServiceClient: jest.fn(() => ({
    from: mockServiceFrom,
  })),
}));

function makeChain(result: unknown) {
  const chain: Record<string, jest.Mock> = {} as Record<string, jest.Mock>;
  const link = jest.fn(() => chain);
  chain.select = jest.fn(() => chain);
  chain.eq = link;
  chain.in = link;
  chain.maybeSingle = jest.fn().mockResolvedValue(result);
  return chain;
}

describe("fetchDashboardAccess", () => {
  beforeEach(() => {
    jest.resetModules();
    mockGetUser.mockReset();
    mockFrom.mockReset();
    mockServiceFrom.mockReset();
  });

  it("returns default sharing preferences for signed-out users", async () => {
    const { fetchDashboardAccess } = await import("../../../lib/dashboard/access");
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const result = await fetchDashboardAccess();

    expect(result.parentShareTasks).toBe(true);
    expect(result.parentShareCalendar).toBe(true);
    expect(result.parentShareContent).toBe(true);
  });

  it("reads parent sharing preferences from the user_access view", async () => {
    const { fetchDashboardAccess } = await import("../../../lib/dashboard/access");
    mockGetUser.mockResolvedValue({ data: { user: { id: "student-1" } } });
    mockFrom
      .mockReturnValueOnce(
        makeChain({
          data: {
            membership_rank: 1,
            membership_tier: "lite",
            membership_purchased_at: null,
            has_membership: true,
            has_parent_seat: true,
            has_agreed_to_community: false,
            first_content_visit_at: null,
            phone_number: null,
            parent_share_tasks: false,
            parent_share_calendar: true,
            parent_share_content: false,
          },
        })
      )
      .mockReturnValueOnce(
        makeChain({
          data: {
            role: "student",
            student_id: null,
          },
        })
      )
      .mockReturnValueOnce(
        makeChain({
          data: {
            parent_email: "parent@example.com",
            status: "accepted",
            accepted_at: "2026-04-22T00:00:00.000Z",
          },
        })
      );

    const result = await fetchDashboardAccess();

    expect(result.parentShareTasks).toBe(false);
    expect(result.parentShareCalendar).toBe(true);
    expect(result.parentShareContent).toBe(false);
  });
});
