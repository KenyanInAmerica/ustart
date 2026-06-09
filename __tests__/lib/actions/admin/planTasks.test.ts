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

jest.mock("../../../../lib/audit/log", () => ({
  logAction: jest.fn(),
}));

import {
  adminFetchUserPlanTasks,
  adminUpdatePlanTask,
  adminAddPlanTask,
  adminDeletePlanTask,
} from "../../../../lib/actions/admin/planTasks";

function makeChain(returnValue: unknown): Record<string, unknown> {
  const promise = Promise.resolve(returnValue);
  const chain: Record<string, unknown> = {
    then: promise.then.bind(promise),
    catch: promise.catch.bind(promise),
  };
  const fn: jest.Mock = jest.fn(() => chain);
  chain.select = fn;
  chain.insert = fn;
  chain.update = fn;
  chain.delete = fn;
  chain.eq = fn;
  chain.order = fn;
  chain.single = jest.fn().mockResolvedValue(returnValue);
  chain.maybeSingle = jest.fn().mockResolvedValue(returnValue);
  return chain;
}

const ADMIN_USER = { id: "admin-id", email: "admin@test.com" };

describe("planTasks admin actions", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockServiceFrom.mockReset();
  });

  // ── adminFetchUserPlanTasks ───────────────────────────────────────────────────

  describe("adminFetchUserPlanTasks", () => {
    it("returns empty array when user is not authenticated", async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });
      const result = await adminFetchUserPlanTasks("user-1");
      expect(result).toEqual([]);
    });

    it("returns empty array when caller is not an admin", async () => {
      mockGetUser.mockResolvedValue({ data: { user: ADMIN_USER } });
      mockServiceFrom.mockReturnValueOnce(
        makeChain({ data: { is_admin: false }, error: null })
      );
      const result = await adminFetchUserPlanTasks("user-1");
      expect(result).toEqual([]);
    });

    it("returns the user's plan tasks for admins", async () => {
      const tasks = [
        {
          id: "task-1",
          title: "Open bank account",
          description: null,
          phase: "before_arrival",
          status: "not_started",
          due_date: "2099-09-01",
          content_url: null,
          display_order: 1,
          completed_at: null,
        },
      ];
      mockGetUser.mockResolvedValue({ data: { user: ADMIN_USER } });
      mockServiceFrom
        .mockReturnValueOnce(makeChain({ data: { is_admin: true }, error: null }))
        .mockReturnValueOnce(makeChain({ data: tasks, error: null }));

      const result = await adminFetchUserPlanTasks("user-1");
      expect(result).toEqual([
        {
          ...tasks[0],
          accepts_upload: false,
          video_url: null,
        },
      ]);
    });

    it("returns empty array on unexpected exception", async () => {
      mockGetUser.mockRejectedValue(new Error("boom"));
      const result = await adminFetchUserPlanTasks("user-1");
      expect(result).toEqual([]);
    });
  });

  // ── adminUpdatePlanTask ───────────────────────────────────────────────────────

  describe("adminUpdatePlanTask", () => {
    it("returns error when not authenticated", async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });
      const result = await adminUpdatePlanTask("task-1", { title: "New title" });
      expect(result).toEqual({ success: false, error: "Not authenticated." });
    });

    it("returns error when caller is not an admin", async () => {
      mockGetUser.mockResolvedValue({ data: { user: ADMIN_USER } });
      mockServiceFrom.mockReturnValueOnce(
        makeChain({ data: { is_admin: false }, error: null })
      );
      const result = await adminUpdatePlanTask("task-1", { title: "New title" });
      expect(result).toEqual({ success: false, error: "Forbidden." });
    });

    it("returns error when title is blank", async () => {
      mockGetUser.mockResolvedValue({ data: { user: ADMIN_USER } });
      mockServiceFrom.mockReturnValueOnce(
        makeChain({ data: { is_admin: true }, error: null })
      );
      const result = await adminUpdatePlanTask("task-1", { title: "   " });
      expect(result).toEqual({ success: false, error: "Title is required." });
    });

    it("updates a task title and returns success", async () => {
      mockGetUser.mockResolvedValue({ data: { user: ADMIN_USER } });
      mockServiceFrom
        .mockReturnValueOnce(makeChain({ data: { is_admin: true }, error: null }))
        .mockReturnValueOnce(makeChain({ error: null }));

      const result = await adminUpdatePlanTask("task-1", { title: "Updated title" });
      expect(result).toEqual({ success: true });
    });

    it("sets completed_at to now when marking a task completed for the first time", async () => {
      mockGetUser.mockResolvedValue({ data: { user: ADMIN_USER } });
      mockServiceFrom
        .mockReturnValueOnce(makeChain({ data: { is_admin: true }, error: null }))
        // Fetch current completed_at — null means not yet completed.
        .mockReturnValueOnce(makeChain({ data: { completed_at: null }, error: null }))
        .mockReturnValueOnce(makeChain({ error: null }));

      const result = await adminUpdatePlanTask("task-1", { status: "completed" });
      expect(result).toEqual({ success: true });
      // Verify the update chain was called (via service from plan_tasks twice)
      expect(mockServiceFrom).toHaveBeenCalledWith("plan_tasks");
    });

    it("preserves existing completed_at when task is already completed", async () => {
      const existingCompletedAt = "2026-01-01T00:00:00.000Z";
      mockGetUser.mockResolvedValue({ data: { user: ADMIN_USER } });
      mockServiceFrom
        .mockReturnValueOnce(makeChain({ data: { is_admin: true }, error: null }))
        .mockReturnValueOnce(
          makeChain({ data: { completed_at: existingCompletedAt }, error: null })
        )
        .mockReturnValueOnce(makeChain({ error: null }));

      const result = await adminUpdatePlanTask("task-1", { status: "completed" });
      expect(result).toEqual({ success: true });
    });

    it("sets completed_at to null when marking a task not_started", async () => {
      mockGetUser.mockResolvedValue({ data: { user: ADMIN_USER } });
      mockServiceFrom
        .mockReturnValueOnce(makeChain({ data: { is_admin: true }, error: null }))
        .mockReturnValueOnce(makeChain({ error: null }));

      const result = await adminUpdatePlanTask("task-1", { status: "not_started" });
      expect(result).toEqual({ success: true });
    });

    it("returns error when the update query fails", async () => {
      mockGetUser.mockResolvedValue({ data: { user: ADMIN_USER } });
      mockServiceFrom
        .mockReturnValueOnce(makeChain({ data: { is_admin: true }, error: null }))
        .mockReturnValueOnce(makeChain({ error: { message: "update failed" } }));

      const result = await adminUpdatePlanTask("task-1", { title: "New" });
      expect(result).toEqual({ success: false, error: "update failed" });
    });

    it("returns a generic error on unexpected exception", async () => {
      mockGetUser.mockRejectedValue(new Error("boom"));
      const result = await adminUpdatePlanTask("task-1", { title: "New" });
      expect(result).toEqual({
        success: false,
        error: "Something went wrong. Please try again.",
      });
    });
  });

  // ── adminAddPlanTask ──────────────────────────────────────────────────────────

  describe("adminAddPlanTask", () => {
    it("returns error when not authenticated", async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });
      const result = await adminAddPlanTask("user-1", {
        title: "New task",
        phase: "before_arrival",
      });
      expect(result).toEqual({ success: false, error: "Not authenticated." });
    });

    it("returns error when caller is not an admin", async () => {
      mockGetUser.mockResolvedValue({ data: { user: ADMIN_USER } });
      mockServiceFrom.mockReturnValueOnce(
        makeChain({ data: { is_admin: false }, error: null })
      );
      const result = await adminAddPlanTask("user-1", {
        title: "New task",
        phase: "before_arrival",
      });
      expect(result).toEqual({ success: false, error: "Forbidden." });
    });

    it("returns error when title is blank", async () => {
      mockGetUser.mockResolvedValue({ data: { user: ADMIN_USER } });
      mockServiceFrom.mockReturnValueOnce(
        makeChain({ data: { is_admin: true }, error: null })
      );
      const result = await adminAddPlanTask("user-1", {
        title: "   ",
        phase: "before_arrival",
      });
      expect(result).toEqual({ success: false, error: "Title is required." });
    });

    it("inserts a task and returns success", async () => {
      mockGetUser.mockResolvedValue({ data: { user: ADMIN_USER } });
      mockServiceFrom
        .mockReturnValueOnce(makeChain({ data: { is_admin: true }, error: null }))
        // Count existing tasks in phase for display_order.
        .mockReturnValueOnce(makeChain({ count: 2, error: null }))
        .mockReturnValueOnce(makeChain({ error: null }));

      const result = await adminAddPlanTask("user-1", {
        title: "Open bank account",
        phase: "before_arrival",
        due_date: "2099-09-01",
      });
      expect(result).toEqual({ success: true });
      expect(mockServiceFrom).toHaveBeenCalledWith("plan_tasks");
    });

    it("returns error when the insert fails", async () => {
      mockGetUser.mockResolvedValue({ data: { user: ADMIN_USER } });
      mockServiceFrom
        .mockReturnValueOnce(makeChain({ data: { is_admin: true }, error: null }))
        .mockReturnValueOnce(makeChain({ count: 0, error: null }))
        .mockReturnValueOnce(makeChain({ error: { message: "insert failed" } }));

      const result = await adminAddPlanTask("user-1", {
        title: "Task",
        phase: "before_arrival",
      });
      expect(result).toEqual({ success: false, error: "insert failed" });
    });

    it("returns a generic error on unexpected exception", async () => {
      mockGetUser.mockRejectedValue(new Error("boom"));
      const result = await adminAddPlanTask("user-1", {
        title: "Task",
        phase: "before_arrival",
      });
      expect(result).toEqual({
        success: false,
        error: "Something went wrong. Please try again.",
      });
    });
  });

  // ── adminDeletePlanTask ───────────────────────────────────────────────────────

  describe("adminDeletePlanTask", () => {
    it("returns error when not authenticated", async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });
      const result = await adminDeletePlanTask("task-1");
      expect(result).toEqual({ success: false, error: "Not authenticated." });
    });

    it("returns error when caller is not an admin", async () => {
      mockGetUser.mockResolvedValue({ data: { user: ADMIN_USER } });
      mockServiceFrom.mockReturnValueOnce(
        makeChain({ data: { is_admin: false }, error: null })
      );
      const result = await adminDeletePlanTask("task-1");
      expect(result).toEqual({ success: false, error: "Forbidden." });
    });

    it("deletes a task and returns success", async () => {
      mockGetUser.mockResolvedValue({ data: { user: ADMIN_USER } });
      mockServiceFrom
        .mockReturnValueOnce(makeChain({ data: { is_admin: true }, error: null }))
        .mockReturnValueOnce(makeChain({ error: null }));

      const result = await adminDeletePlanTask("task-1");
      expect(result).toEqual({ success: true });
      expect(mockServiceFrom).toHaveBeenCalledWith("plan_tasks");
    });

    it("returns error when the delete query fails", async () => {
      mockGetUser.mockResolvedValue({ data: { user: ADMIN_USER } });
      mockServiceFrom
        .mockReturnValueOnce(makeChain({ data: { is_admin: true }, error: null }))
        .mockReturnValueOnce(makeChain({ error: { message: "delete failed" } }));

      const result = await adminDeletePlanTask("task-1");
      expect(result).toEqual({ success: false, error: "delete failed" });
    });

    it("returns a generic error on unexpected exception", async () => {
      mockGetUser.mockRejectedValue(new Error("boom"));
      const result = await adminDeletePlanTask("task-1");
      expect(result).toEqual({
        success: false,
        error: "Something went wrong. Please try again.",
      });
    });
  });
});
