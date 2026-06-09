"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { logAction } from "@/lib/audit/log";
import { AuditAction } from "@/lib/audit/actions";
import { trackHubSpotContact, trackHubSpotNote, toHubSpotDate } from "@/lib/hubspot/contacts";
import { getHubSpotEnvironment } from "@/lib/hubspot/client";
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
        "id, title, description, phase, days_from_arrival, content_url, video_url, accepts_upload, tier_required, display_order, created_at, updated_at"
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
      due_date:
        template.days_from_arrival === null
          ? null
          : addDays(profile.arrival_date!, template.days_from_arrival),
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

export async function recalculatePlanDueDates(): Promise<
  { success: true; updatedCount: number } | { success: false; error: string }
> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Not authenticated." };

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("arrival_date")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) return { success: false, error: profileError.message };

    const newArrivalDate =
      (profileData as { arrival_date: string | null } | null)?.arrival_date ??
      null;

    if (!newArrivalDate) {
      return { success: false, error: "No arrival date set on your profile." };
    }

    // Fetch tasks that are template-linked so we can recalculate their due dates.
    const { data: taskData, error: taskError } = await supabase
      .from("plan_tasks")
      .select(
        "id, plan_task_templates!template_id(days_from_arrival)"
      )
      .eq("user_id", user.id)
      .not("template_id", "is", null);

    if (taskError) return { success: false, error: taskError.message };

    type TaskRow = {
      id: string;
      plan_task_templates: { days_from_arrival: number | null }[] | null;
    };

    const rows = (taskData ?? []) as unknown as TaskRow[];
    const updates = rows.flatMap((row) => {
      const templateRow = Array.isArray(row.plan_task_templates)
        ? row.plan_task_templates[0]
        : row.plan_task_templates;
      if (!templateRow) return [];
      return [
        {
          id: row.id,
          due_date:
            templateRow.days_from_arrival === null
              ? null
              : addDays(newArrivalDate, templateRow.days_from_arrival),
        },
      ];
    });

    if (updates.length === 0) return { success: true, updatedCount: 0 };

    const service = createServiceClient();
    const results = await Promise.all(
      updates.map(({ id, due_date }) =>
        service.from("plan_tasks").update({ due_date }).eq("id", id)
      )
    );

    const failed = results.find((r) => r.error);
    if (failed?.error) return { success: false, error: failed.error.message };

    trackHubSpotContact({
      email: user.email ?? "",
      ustart_environment: getHubSpotEnvironment(),
      ustart_arrival_date: toHubSpotDate(newArrivalDate),
    });

    return { success: true, updatedCount: updates.length };
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

    void (async () => {
      try {
        const service = createServiceClient();
        const { data: taskData } = await service
          .from("plan_tasks")
          .select("status")
          .eq("user_id", user.id);
        const tasks = (taskData ?? []) as { status: string }[];
        const total = tasks.length;
        const completed = tasks.filter((t) => t.status === "completed").length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
        trackHubSpotContact({
          email: user.email ?? "",
          ustart_environment: getHubSpotEnvironment(),
          ustart_plan_progress: percentage,
          ...(percentage === 100 ? { hs_lead_status: "CONNECTED" } : {}),
        });
        if (percentage === 100) {
          trackHubSpotNote(
            user.email ?? "",
            "Student completed their UStart plan — all tasks marked complete."
          );
        }
      } catch {
        // fire-and-forget — never surface to caller
      }
    })();

    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
