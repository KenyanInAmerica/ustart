/** @jest-environment node */

const mockGetUser = jest.fn();
const mockServerFrom = jest.fn();
const mockServiceFrom = jest.fn();

jest.mock("../../../lib/supabase/server", () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockServerFrom,
  })),
}));

jest.mock("../../../lib/supabase/service", () => ({
  createServiceClient: jest.fn(() => ({
    from: mockServiceFrom,
  })),
}));

jest.mock("../../../lib/audit/log", () => ({
  logAction: jest.fn(),
}));

import {
  instantiatePlan,
  reinstantiatePlan,
  updateTaskStatus,
} from "../../../lib/actions/plan";

function makeAsyncChain(returnValue: unknown): Record<string, unknown> {
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
  chain.delete = fn;
  chain.update = fn;
  chain.insert = fn;
  chain.maybeSingle = jest.fn().mockResolvedValue(returnValue);
  return chain;
}

describe("plan actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("instantiates plan tasks for the user's active tier", async () => {
    mockServiceFrom
      .mockReturnValueOnce(
        makeAsyncChain({
          data: {
            arrival_date: "2026-08-20",
            intake_completed_at: "2026-04-21T00:00:00.000Z",
          },
          error: null,
        })
      )
      .mockReturnValueOnce(
        makeAsyncChain({
          data: { tier: "explore" },
          error: null,
        })
      )
      .mockReturnValueOnce(
        makeAsyncChain({
          data: [
            {
              id: "template-1",
              title: "Task one",
              description: "Desc",
              phase: "before_arrival",
              days_from_arrival: 0,
              content_url: "https://notion.so/one",
              tier_required: "lite",
              display_order: 1,
              created_at: "2026-04-21T00:00:00.000Z",
              updated_at: "2026-04-21T00:00:00.000Z",
            },
            {
              id: "template-2",
              title: "Task two",
              description: null,
              phase: "first_7_days",
              days_from_arrival: 7,
              content_url: null,
              tier_required: "explore",
              display_order: 2,
              created_at: "2026-04-21T00:00:00.000Z",
              updated_at: "2026-04-21T00:00:00.000Z",
            },
          ],
          error: null,
        })
      )
      .mockReturnValueOnce(makeAsyncChain({ error: null }))
      .mockReturnValueOnce(makeAsyncChain({ error: null }));

    const result = await instantiatePlan("user-1");

    expect(result).toEqual({ success: true, taskCount: 2 });
    expect(mockServiceFrom).toHaveBeenCalledWith("plan_task_templates");
    expect(mockServiceFrom).toHaveBeenCalledWith("plan_tasks");
  });

  it("returns zero tasks when arrival_date is missing", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    mockServiceFrom.mockReturnValueOnce(
      makeAsyncChain({
        data: { arrival_date: null, intake_completed_at: null },
        error: null,
      })
    );

    const result = await instantiatePlan("user-1");

    expect(result).toEqual({ success: true, taskCount: 0 });
    warnSpy.mockRestore();
  });

  it("reinstantiates plans for admins", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "admin-1", email: "admin@test.com" } },
    });
    mockServiceFrom
      .mockReturnValueOnce(makeAsyncChain({ data: { is_admin: true }, error: null }))
      .mockReturnValueOnce(
        makeAsyncChain({
          data: {
            arrival_date: "2026-08-20",
            intake_completed_at: "2026-04-21T00:00:00.000Z",
          },
          error: null,
        })
      )
      .mockReturnValueOnce(makeAsyncChain({ data: { tier: "lite" }, error: null }))
      .mockReturnValueOnce(
        makeAsyncChain({
          data: [],
          error: null,
        })
      )
      .mockReturnValueOnce(makeAsyncChain({ error: null }));

    const result = await reinstantiatePlan("user-1");

    expect(result).toEqual({ success: true, taskCount: 0 });
  });

  it("updates a task status for the owning user", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "student@test.com" } },
    });
    mockServerFrom
      .mockReturnValueOnce(makeAsyncChain({ data: { id: "task-1" }, error: null }))
      .mockReturnValueOnce(makeAsyncChain({ error: null }));

    const result = await updateTaskStatus("task-1", "completed");

    expect(result).toEqual({ success: true });
  });

  it("returns not found when the task does not belong to the user", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "student@test.com" } },
    });
    mockServerFrom.mockReturnValueOnce(
      makeAsyncChain({ data: null, error: null })
    );

    const result = await updateTaskStatus("task-1", "completed");

    expect(result).toEqual({ success: false, error: "Task not found." });
  });
});
