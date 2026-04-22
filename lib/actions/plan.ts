"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { logAction } from "@/lib/audit/log";
import { AuditAction } from "@/lib/audit/actions";
import type { PlanTaskStatus, PlanTaskTemplate } from "@/lib/types/plan";

type ActionResult = { success: true } | { success: false; error: string };
type InstantiatePlanResult =
  | { success: true; taskCount: number }
  | { success: false; error: string };

type MembershipTier = "lite" | "explore" | "concierge";

type ProfilePlanRow = {
  arrival_date: string | null;
  intake_completed_at: string | null;
};

function tiersUpTo(tier: MembershipTier): MembershipTier[] {
  switch (tier) {
    case "concierge":
      return ["lite", "explore", "concierge"];
    case "explore":
      return ["lite", "explore"];
    default:
      return ["lite"];
  }
}

function addDays(dateOnly: string, days: number): string {
  const parsed = new Date(`${dateOnly}T00:00:00.000Z`);
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
}

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

// Internal helper used by intake completion and admin rebuilds.
// Admin reads/writes for plan_tasks should continue to use the service client;
// no extra RLS policy is needed because cross-user admin access is intentional.
export async function instantiatePlan(userId: string): Promise<InstantiatePlanResult> {
  try {
    const service = createServiceClient();

    const { data: profileData, error: profileError } = await service
      .from("profiles")
      .select("arrival_date, intake_completed_at")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) return { success: false, error: profileError.message };

    const profile = profileData as ProfilePlanRow | null;
    if (!profile?.arrival_date) {
      console.warn(
        `[plan] Skipping instantiation for user ${userId}: arrival_date is missing.`
      );
      return { success: true, taskCount: 0 };
    }

    const { data: membershipData, error: membershipError } = await service
      .from("memberships")
      .select("tier")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    if (membershipError) return { success: false, error: membershipError.message };

    const membershipTier =
      ((membershipData as { tier: MembershipTier | null } | null)?.tier ?? "lite");
    const allowedTiers = tiersUpTo(membershipTier);

    const { data: templateData, error: templateError } = await service
      .from("plan_task_templates")
      .select(
        "id, title, description, phase, days_from_arrival, content_url, tier_required, display_order, created_at, updated_at"
      )
      .in("tier_required", allowedTiers)
      .order("phase")
      .order("display_order");

    if (templateError) return { success: false, error: templateError.message };

    const templates = (templateData ?? []) as PlanTaskTemplate[];

    const { error: deleteError } = await service
      .from("plan_tasks")
      .delete()
      .eq("user_id", userId);

    if (deleteError) return { success: false, error: deleteError.message };

    if (templates.length === 0) {
      return { success: true, taskCount: 0 };
    }

    const taskRows = templates.map((template) => ({
      user_id: userId,
      template_id: template.id,
      title: template.title,
      description: template.description,
      phase: template.phase,
      status: "not_started" as const,
      due_date: addDays(profile.arrival_date!, template.days_from_arrival),
      content_url: template.content_url,
      display_order: template.display_order,
    }));

    const { error: insertError } = await service.from("plan_tasks").insert(taskRows);
    if (insertError) return { success: false, error: insertError.message };

    return { success: true, taskCount: taskRows.length };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function reinstantiatePlan(userId: string): Promise<InstantiatePlanResult> {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return { success: false, error: auth.error };

    const result = await instantiatePlan(userId);
    if (!result.success) return result;

    void logAction({
      actorId: auth.adminId,
      actorEmail: auth.adminEmail,
      action: AuditAction.ADMIN_PLAN_REINSTANTIATED,
      targetId: userId,
      payload: { taskCount: result.taskCount },
    });

    return result;
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function updateTaskStatus(
  taskId: string,
  status: PlanTaskStatus
): Promise<ActionResult> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Not authenticated." };

    const { data: taskData, error: taskError } = await supabase
      .from("plan_tasks")
      .select("id")
      .eq("id", taskId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (taskError) return { success: false, error: taskError.message };
    if (!taskData) return { success: false, error: "Task not found." };

    const completedAt = status === "completed" ? new Date().toISOString() : null;
    const { error: updateError } = await supabase
      .from("plan_tasks")
      .update({
        status,
        completed_at: completedAt,
      })
      .eq("id", taskId)
      .eq("user_id", user.id);

    if (updateError) return { success: false, error: updateError.message };
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
