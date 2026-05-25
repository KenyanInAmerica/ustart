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

// HubSpot tracking is fire-and-forget — mock to prevent console noise in tests.
jest.mock("../../../lib/hubspot/contacts", () => ({
  trackHubSpotContact: jest.fn(),
  trackHubSpotNote: jest.fn(),
  toHubSpotDate: jest.fn((d: string) => d),
}));
jest.mock("../../../lib/hubspot/client", () => ({
  getHubSpotEnvironment: jest.fn(() => "staging"),
}));

import {
  instantiatePlan,
  reinstantiatePlan,
  recalculatePlanDueDates,
  updateTaskStatus,
} from "../../../lib/actions/plan";
import { trackHubSpotContact, trackHubSpotNote } from "../../../lib/hubspot/contacts";

const mockTrackHubSpotContact = trackHubSpotContact as jest.Mock;
const mockTrackHubSpotNote = trackHubSpotNote as jest.Mock;

// Flush pending microtasks so fire-and-forget IIFEs can complete.
const flush = () => new Promise<void>((r) => setTimeout(r, 0));

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
  chain.not = fn;
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

  // ── instantiatePlan error paths ──────────────────────────────────────────────

  it("instantiatePlan returns error when profile select fails", async () => {
    mockServiceFrom.mockReturnValueOnce(
      makeAsyncChain({ data: null, error: { message: "profile select error" } })
    );
    const result = await instantiatePlan("user-1");
    expect(result).toEqual({ success: false, error: "profile select error" });
  });

  it("instantiatePlan returns error when membership query fails", async () => {
    mockServiceFrom
      .mockReturnValueOnce(makeAsyncChain({ data: { arrival_date: "2026-08-20", intake_completed_at: "2026-04-21T00:00:00.000Z" }, error: null }))
      .mockReturnValueOnce(makeAsyncChain({ data: null, error: { message: "membership error" } }));
    const result = await instantiatePlan("user-1");
    expect(result).toEqual({ success: false, error: "membership error" });
  });

  it("instantiatePlan returns error when template query fails", async () => {
    mockServiceFrom
      .mockReturnValueOnce(makeAsyncChain({ data: { arrival_date: "2026-08-20", intake_completed_at: "2026-04-21T00:00:00.000Z" }, error: null }))
      .mockReturnValueOnce(makeAsyncChain({ data: { tier: "lite" }, error: null }))
      .mockReturnValueOnce(makeAsyncChain({ data: null, error: { message: "template error" } }));
    const result = await instantiatePlan("user-1");
    expect(result).toEqual({ success: false, error: "template error" });
  });

  it("instantiatePlan returns error when plan_tasks delete fails", async () => {
    mockServiceFrom
      .mockReturnValueOnce(makeAsyncChain({ data: { arrival_date: "2026-08-20", intake_completed_at: "2026-04-21T00:00:00.000Z" }, error: null }))
      .mockReturnValueOnce(makeAsyncChain({ data: { tier: "lite" }, error: null }))
      .mockReturnValueOnce(makeAsyncChain({ data: [], error: null }))
      .mockReturnValueOnce(makeAsyncChain({ error: { message: "delete error" } }));
    const result = await instantiatePlan("user-1");
    expect(result).toEqual({ success: false, error: "delete error" });
  });

  it("instantiatePlan returns error when task insert fails", async () => {
    const template = { id: "t1", title: "Task", description: null, phase: "before_arrival", days_from_arrival: 0, content_url: null, tier_required: "lite", display_order: 1, created_at: "2026-04-21T00:00:00.000Z", updated_at: "2026-04-21T00:00:00.000Z" };
    mockServiceFrom
      .mockReturnValueOnce(makeAsyncChain({ data: { arrival_date: "2026-08-20", intake_completed_at: "2026-04-21T00:00:00.000Z" }, error: null }))
      .mockReturnValueOnce(makeAsyncChain({ data: { tier: "lite" }, error: null }))
      .mockReturnValueOnce(makeAsyncChain({ data: [template], error: null }))
      .mockReturnValueOnce(makeAsyncChain({ error: null }))
      .mockReturnValueOnce(makeAsyncChain({ error: { message: "insert error" } }));
    const result = await instantiatePlan("user-1");
    expect(result).toEqual({ success: false, error: "insert error" });
  });

  it("instantiatePlan returns a generic error when an unexpected exception is thrown", async () => {
    // No mock setup — service.from() returns undefined, .select() throws TypeError, caught by outer catch.
    const result = await instantiatePlan("user-1");
    expect(result).toEqual({ success: false, error: "Something went wrong. Please try again." });
  });

  // ── reinstantiatePlan error paths ─────────────────────────────────────────────

  it("reinstantiatePlan returns error when caller is not an admin", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1", email: "u@test.com" } } });
    mockServiceFrom.mockReturnValueOnce(makeAsyncChain({ data: { is_admin: false }, error: null }));
    const result = await reinstantiatePlan("user-1");
    expect(result).toEqual({ success: false, error: "Forbidden." });
  });

  it("reinstantiatePlan returns the inner error when instantiatePlan fails", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "admin-1", email: "admin@test.com" } } });
    mockServiceFrom
      .mockReturnValueOnce(makeAsyncChain({ data: { is_admin: true }, error: null }))
      .mockReturnValueOnce(makeAsyncChain({ data: null, error: { message: "plan build error" } }));
    const result = await reinstantiatePlan("user-1");
    expect(result).toEqual({ success: false, error: "plan build error" });
  });

  it("reinstantiatePlan returns a generic error when an unexpected exception is thrown", async () => {
    mockGetUser.mockRejectedValue(new Error("auth exception"));
    const result = await reinstantiatePlan("user-1");
    expect(result).toEqual({ success: false, error: "Something went wrong. Please try again." });
  });

  // ── updateTaskStatus additional paths ─────────────────────────────────────────

  it("updateTaskStatus returns error when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const result = await updateTaskStatus("task-1", "completed");
    expect(result).toEqual({ success: false, error: "Not authenticated." });
  });

  it("updateTaskStatus returns error when the task select fails", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1", email: "u@test.com" } } });
    mockServerFrom.mockReturnValueOnce(
      makeAsyncChain({ data: null, error: { message: "task select error" } })
    );
    const result = await updateTaskStatus("task-1", "completed");
    expect(result).toEqual({ success: false, error: "task select error" });
  });

  it("updateTaskStatus returns error when the task update fails", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1", email: "u@test.com" } } });
    mockServerFrom
      .mockReturnValueOnce(makeAsyncChain({ data: { id: "task-1" }, error: null }))
      .mockReturnValueOnce(makeAsyncChain({ error: { message: "update error" } }));
    const result = await updateTaskStatus("task-1", "completed");
    expect(result).toEqual({ success: false, error: "update error" });
  });

  it("tracks 0% progress when no plan tasks exist for the user", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1", email: "u@test.com" } } });
    mockServerFrom
      .mockReturnValueOnce(makeAsyncChain({ data: { id: "task-1" }, error: null }))
      .mockReturnValueOnce(makeAsyncChain({ error: null }));
    mockServiceFrom.mockReturnValueOnce(makeAsyncChain({ data: [], error: null }));

    await updateTaskStatus("task-1", "completed");
    await flush();

    expect(mockTrackHubSpotContact).toHaveBeenCalledWith(
      expect.objectContaining({ ustart_plan_progress: 0 })
    );
  });

  // ── additional branch coverage ────────────────────────────────────────────────

  it("reinstantiatePlan returns error when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const result = await reinstantiatePlan("user-1");
    expect(result).toEqual({ success: false, error: "Not authenticated." });
  });

  it("reinstantiatePlan uses empty string for adminEmail when user has no email", async () => {
    // Covers the user.email ?? "" fallback in requireAdmin.
    mockGetUser.mockResolvedValue({ data: { user: { id: "admin-1" } } }); // no email
    mockServiceFrom
      .mockReturnValueOnce(makeAsyncChain({ data: { is_admin: true }, error: null }))
      .mockReturnValueOnce(makeAsyncChain({ data: null, error: { message: "plan error" } }));
    const result = await reinstantiatePlan("user-1");
    expect(result).toEqual({ success: false, error: "plan error" });
  });

  it("instantiatePlan defaults to lite tier when user has no active membership", async () => {
    // Covers the tier ?? "lite" branch (membershipData is null).
    mockServiceFrom
      .mockReturnValueOnce(makeAsyncChain({ data: { arrival_date: "2026-08-20", intake_completed_at: "2026-04-21T00:00:00.000Z" }, error: null }))
      .mockReturnValueOnce(makeAsyncChain({ data: null, error: null })) // no membership row
      .mockReturnValueOnce(makeAsyncChain({ data: [], error: null }))
      .mockReturnValueOnce(makeAsyncChain({ error: null }));
    const result = await instantiatePlan("user-1");
    expect(result).toEqual({ success: true, taskCount: 0 });
  });

  it("instantiatePlan handles null templateData by treating it as empty", async () => {
    // Covers the templateData ?? [] branch.
    mockServiceFrom
      .mockReturnValueOnce(makeAsyncChain({ data: { arrival_date: "2026-08-20", intake_completed_at: "2026-04-21T00:00:00.000Z" }, error: null }))
      .mockReturnValueOnce(makeAsyncChain({ data: { tier: "lite" }, error: null }))
      .mockReturnValueOnce(makeAsyncChain({ data: null, error: null })) // null template data
      .mockReturnValueOnce(makeAsyncChain({ error: null }));
    const result = await instantiatePlan("user-1");
    expect(result).toEqual({ success: true, taskCount: 0 });
  });

  it("updateTaskStatus sets completedAt to null for non-completed statuses", async () => {
    // Covers the ternary false branch: status !== "completed" → completedAt = null.
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1", email: "u@test.com" } } });
    mockServerFrom
      .mockReturnValueOnce(makeAsyncChain({ data: { id: "task-1" }, error: null }))
      .mockReturnValueOnce(makeAsyncChain({ error: null }));
    const result = await updateTaskStatus("task-1", "in_progress");
    expect(result).toEqual({ success: true });
  });

  it("handles null taskData in the HubSpot progress IIFE", async () => {
    // Covers taskData ?? [] when the select returns null data.
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1", email: "u@test.com" } } });
    mockServerFrom
      .mockReturnValueOnce(makeAsyncChain({ data: { id: "task-1" }, error: null }))
      .mockReturnValueOnce(makeAsyncChain({ error: null }));
    mockServiceFrom.mockReturnValueOnce(makeAsyncChain({ data: null, error: null }));

    await updateTaskStatus("task-1", "completed");
    await flush();

    expect(mockTrackHubSpotContact).toHaveBeenCalledWith(
      expect.objectContaining({ ustart_plan_progress: 0 })
    );
  });

  it("uses empty string for email in IIFE when user has no email address", async () => {
    // Covers the user.email ?? "" fallbacks in trackHubSpotContact and trackHubSpotNote.
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } } }); // no email
    mockServerFrom
      .mockReturnValueOnce(makeAsyncChain({ data: { id: "task-1" }, error: null }))
      .mockReturnValueOnce(makeAsyncChain({ error: null }));
    mockServiceFrom.mockReturnValueOnce(
      makeAsyncChain({ data: [{ status: "completed" }, { status: "completed" }], error: null })
    );

    await updateTaskStatus("task-1", "completed");
    await flush();

    expect(mockTrackHubSpotContact).toHaveBeenCalledWith(
      expect.objectContaining({ email: "", ustart_plan_progress: 100 })
    );
    expect(mockTrackHubSpotNote).toHaveBeenCalledWith("", expect.any(String));
  });

  // ── tiersUpTo ─────────────────────────────────────────────────────────────────

  it("instantiates plan tasks for a concierge tier user", async () => {
    mockServiceFrom
      .mockReturnValueOnce(
        makeAsyncChain({ data: { arrival_date: "2026-08-20", intake_completed_at: "2026-04-21T00:00:00.000Z" }, error: null })
      )
      .mockReturnValueOnce(makeAsyncChain({ data: { tier: "concierge" }, error: null }))
      .mockReturnValueOnce(makeAsyncChain({ data: [], error: null }))
      .mockReturnValueOnce(makeAsyncChain({ error: null }));

    const result = await instantiatePlan("user-1");

    expect(result).toEqual({ success: true, taskCount: 0 });
    // Concierge tier must include all three tier levels.
    const templateCall = mockServiceFrom.mock.calls.find(
      (c) => (c as string[])[0] === "plan_task_templates"
    );
    expect(templateCall).toBeDefined();
  });

  it("tracks plan progress in HubSpot after a task status update", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "student@test.com" } },
    });
    mockServerFrom
      .mockReturnValueOnce(makeAsyncChain({ data: { id: "task-1" }, error: null }))
      .mockReturnValueOnce(makeAsyncChain({ error: null }));
    // Service client: plan_tasks select for the fire-and-forget progress calc.
    mockServiceFrom.mockReturnValueOnce(
      makeAsyncChain({
        data: [{ status: "completed" }, { status: "not_started" }],
        error: null,
      })
    );

    await updateTaskStatus("task-1", "completed");
    await flush();

    expect(mockTrackHubSpotContact).toHaveBeenCalledWith(
      expect.objectContaining({ ustart_plan_progress: 50 })
    );
    expect(mockTrackHubSpotNote).not.toHaveBeenCalled();
  });

  it("marks contact CONNECTED and creates a note when plan reaches 100%", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "student@test.com" } },
    });
    mockServerFrom
      .mockReturnValueOnce(makeAsyncChain({ data: { id: "task-1" }, error: null }))
      .mockReturnValueOnce(makeAsyncChain({ error: null }));
    mockServiceFrom.mockReturnValueOnce(
      makeAsyncChain({
        data: [{ status: "completed" }, { status: "completed" }],
        error: null,
      })
    );

    await updateTaskStatus("task-1", "completed");
    await flush();

    expect(mockTrackHubSpotContact).toHaveBeenCalledWith(
      expect.objectContaining({
        ustart_plan_progress: 100,
        hs_lead_status: "CONNECTED",
      })
    );
    expect(mockTrackHubSpotNote).toHaveBeenCalledWith(
      "student@test.com",
      expect.stringContaining("all tasks marked complete")
    );
  });

  it("returns a generic error when updateTaskStatus encounters an unexpected exception", async () => {
    mockGetUser.mockRejectedValue(new Error("unexpected"));

    const result = await updateTaskStatus("task-1", "completed");

    expect(result).toEqual({
      success: false,
      error: "Something went wrong. Please try again.",
    });
  });

  // ── recalculatePlanDueDates ───────────────────────────────────────────────────

  it("recalculatePlanDueDates returns error when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const result = await recalculatePlanDueDates();
    expect(result).toEqual({ success: false, error: "Not authenticated." });
  });

  it("recalculatePlanDueDates returns error when profile fetch fails", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1", email: "u@test.com" } } });
    mockServerFrom.mockReturnValueOnce(
      makeAsyncChain({ data: null, error: { message: "profile error" } })
    );
    const result = await recalculatePlanDueDates();
    expect(result).toEqual({ success: false, error: "profile error" });
  });

  it("recalculatePlanDueDates returns error when arrival_date is missing", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1", email: "u@test.com" } } });
    mockServerFrom.mockReturnValueOnce(
      makeAsyncChain({ data: { arrival_date: null }, error: null })
    );
    const result = await recalculatePlanDueDates();
    expect(result).toEqual({ success: false, error: "No arrival date set on your profile." });
  });

  it("recalculatePlanDueDates returns error when task fetch fails", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1", email: "u@test.com" } } });
    mockServerFrom
      .mockReturnValueOnce(makeAsyncChain({ data: { arrival_date: "2099-01-01" }, error: null }))
      .mockReturnValueOnce(makeAsyncChain({ data: null, error: { message: "task fetch error" } }));
    const result = await recalculatePlanDueDates();
    expect(result).toEqual({ success: false, error: "task fetch error" });
  });

  it("recalculatePlanDueDates returns updatedCount 0 when no template-linked tasks exist", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1", email: "u@test.com" } } });
    mockServerFrom
      .mockReturnValueOnce(makeAsyncChain({ data: { arrival_date: "2099-01-01" }, error: null }))
      .mockReturnValueOnce(makeAsyncChain({ data: [], error: null }));
    const result = await recalculatePlanDueDates();
    expect(result).toEqual({ success: true, updatedCount: 0 });
  });

  it("recalculatePlanDueDates updates due dates and returns correct count", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1", email: "u@test.com" } } });
    mockServerFrom
      .mockReturnValueOnce(makeAsyncChain({ data: { arrival_date: "2099-01-01" }, error: null }))
      .mockReturnValueOnce(
        makeAsyncChain({
          data: [
            { id: "task-1", plan_task_templates: [{ days_from_arrival: 0 }] },
            { id: "task-2", plan_task_templates: [{ days_from_arrival: 7 }] },
          ],
          error: null,
        })
      );
    mockServiceFrom
      .mockReturnValueOnce(makeAsyncChain({ error: null }))
      .mockReturnValueOnce(makeAsyncChain({ error: null }));

    const result = await recalculatePlanDueDates();
    expect(result).toEqual({ success: true, updatedCount: 2 });
  });

  it("recalculatePlanDueDates returns error when a batch due-date update fails", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1", email: "u@test.com" } } });
    mockServerFrom
      .mockReturnValueOnce(makeAsyncChain({ data: { arrival_date: "2099-01-01" }, error: null }))
      .mockReturnValueOnce(
        makeAsyncChain({
          data: [{ id: "task-1", plan_task_templates: [{ days_from_arrival: 0 }] }],
          error: null,
        })
      );
    mockServiceFrom.mockReturnValueOnce(
      makeAsyncChain({ error: { message: "due date update failed" } })
    );

    const result = await recalculatePlanDueDates();
    expect(result).toEqual({ success: false, error: "due date update failed" });
  });

  it("recalculatePlanDueDates returns a generic error on unexpected exception", async () => {
    mockGetUser.mockRejectedValue(new Error("unexpected"));
    const result = await recalculatePlanDueDates();
    expect(result).toEqual({ success: false, error: "Something went wrong. Please try again." });
  });
});
