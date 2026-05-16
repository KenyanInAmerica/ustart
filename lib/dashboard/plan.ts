import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  PLAN_PHASES,
  PLAN_PHASE_COLORS,
  PLAN_PHASE_LABELS,
  type PlanPhase,
  type PlanPhaseGroup,
  type PlanTask,
} from "@/lib/types/plan";

function normalizeContentPath(url: string): string {
  try {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return new URL(url).pathname.replace(/\/$/, "");
    }
  } catch {
    // fall through to relative path handling
  }
  return url.split("?")[0].replace(/\/$/, "");
}

export const fetchUserPlan = cache(
  async (
    userId: string,
    options?: { bypassRls?: boolean }
  ): Promise<PlanPhaseGroup[]> => {
    const supabase = options?.bypassRls ? createServiceClient() : createClient();
    const { data } = await supabase
      .from("plan_tasks")
      .select(
        "id, title, description, phase, status, due_date, content_url, display_order, completed_at"
      )
      .eq("user_id", userId)
      .order("phase")
      .order("display_order")
      .order("created_at");

    const tasks = (data ?? []) as PlanTask[];

    return PLAN_PHASES.map((phase) => {
      const phaseTasks = tasks.filter((task) => task.phase === phase);
      const completedCount = phaseTasks.filter(
        (task) => task.status === "completed"
      ).length;

      return {
        phase,
        label: PLAN_PHASE_LABELS[phase],
        color: PLAN_PHASE_COLORS[phase],
        tasks: phaseTasks,
        completedCount,
        totalCount: phaseTasks.length,
      };
    }).filter((group) => group.tasks.length > 0);
  }
);

export const getTaskForContentUrl = cache(
  async (userId: string, contentPath: string): Promise<PlanTask | null> => {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("plan_tasks")
      .select(
        "id, title, description, phase, status, due_date, content_url, display_order, completed_at"
      )
      .eq("user_id", userId)
      .not("content_url", "is", null);

    const tasks = (data ?? []) as PlanTask[];
    const normalizedTarget = normalizeContentPath(contentPath);

    return (
      tasks.find((task) => {
        if (!task.content_url) return false;
        return normalizeContentPath(task.content_url) === normalizedTarget;
      }) ?? null
    );
  }
);
