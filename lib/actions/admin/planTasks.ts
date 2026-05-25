"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { logAction } from "@/lib/audit/log";
import { AuditAction } from "@/lib/audit/actions";
import type { PlanPhase, PlanTask, PlanTaskStatus } from "@/lib/types/plan";

type ActionResult = { success: true } | { success: false; error: string };

async function requireAdmin(): Promise<
  { ok: true; adminId: string; adminEmail: string } | { ok: false; error: string }
> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated." };

  const service = createServiceClient();
  const { data: profile } = await service
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  const p = profile as { is_admin: boolean | null } | null;
  if (!p?.is_admin) return { ok: false, error: "Forbidden." };

  return { ok: true, adminId: user.id, adminEmail: user.email ?? "" };
}

// Returns an empty array on auth failure so the client can render safely.
export async function adminFetchUserPlanTasks(userId: string): Promise<PlanTask[]> {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return [];

    const service = createServiceClient();
    const { data } = await service
      .from("plan_tasks")
      .select(
        "id, title, description, phase, status, due_date, content_url, display_order, completed_at"
      )
      .eq("user_id", userId)
      .order("phase")
      .order("display_order")
      .order("created_at");

    return (data ?? []) as PlanTask[];
  } catch {
    return [];
  }
}

export async function adminUpdatePlanTask(
  taskId: string,
  updates: {
    title?: string;
    status?: PlanTaskStatus;
    due_date?: string | null;
    content_url?: string | null;
    description?: string | null;
  }
): Promise<ActionResult> {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return { success: false, error: auth.error };

    const service = createServiceClient();
    const updatePayload: Record<string, unknown> = {};

    if (updates.title !== undefined) {
      const title = updates.title.trim();
      if (!title) return { success: false, error: "Title is required." };
      updatePayload.title = title;
    }

    if (updates.description !== undefined) {
      updatePayload.description = updates.description;
    }

    if (updates.content_url !== undefined) {
      updatePayload.content_url = updates.content_url;
    }

    if (updates.due_date !== undefined) {
      updatePayload.due_date = updates.due_date;
    }

    if (updates.status !== undefined) {
      updatePayload.status = updates.status;

      if (updates.status === "completed") {
        // Preserve an existing completed_at; only stamp now() on first completion.
        const { data: current } = await service
          .from("plan_tasks")
          .select("completed_at")
          .eq("id", taskId)
          .maybeSingle();
        const existing = current as { completed_at: string | null } | null;
        updatePayload.completed_at =
          existing?.completed_at ?? new Date().toISOString();
      } else {
        updatePayload.completed_at = null;
      }
    }

    const { error: updateError } = await service
      .from("plan_tasks")
      .update(updatePayload)
      .eq("id", taskId);

    if (updateError) return { success: false, error: updateError.message };

    void logAction({
      actorId: auth.adminId,
      actorEmail: auth.adminEmail,
      action: AuditAction.ADMIN_PLAN_TASK_UPDATED,
      targetId: taskId,
      payload: updates,
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function adminAddPlanTask(
  userId: string,
  task: {
    title: string;
    phase: PlanPhase;
    status?: PlanTaskStatus;
    due_date?: string | null;
    content_url?: string | null;
    description?: string | null;
    display_order?: number;
  }
): Promise<ActionResult> {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return { success: false, error: auth.error };

    const title = task.title.trim();
    if (!title) return { success: false, error: "Title is required." };

    const service = createServiceClient();

    // Position after existing tasks in this phase.
    const { count } = await service
      .from("plan_tasks")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("phase", task.phase);

    const displayOrder = task.display_order ?? (count ?? 0) + 1;

    const { error: insertError } = await service.from("plan_tasks").insert({
      user_id: userId,
      template_id: null,
      title,
      phase: task.phase,
      status: task.status ?? "not_started",
      due_date: task.due_date ?? null,
      content_url: task.content_url ?? null,
      description: task.description ?? null,
      display_order: displayOrder,
    });

    if (insertError) return { success: false, error: insertError.message };

    void logAction({
      actorId: auth.adminId,
      actorEmail: auth.adminEmail,
      action: AuditAction.ADMIN_PLAN_TASK_ADDED,
      targetId: userId,
      payload: { title, phase: task.phase },
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function adminDeletePlanTask(taskId: string): Promise<ActionResult> {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return { success: false, error: auth.error };

    const service = createServiceClient();
    const { error: deleteError } = await service
      .from("plan_tasks")
      .delete()
      .eq("id", taskId);

    if (deleteError) return { success: false, error: deleteError.message };

    void logAction({
      actorId: auth.adminId,
      actorEmail: auth.adminEmail,
      action: AuditAction.ADMIN_PLAN_TASK_DELETED,
      targetId: taskId,
      payload: {},
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
