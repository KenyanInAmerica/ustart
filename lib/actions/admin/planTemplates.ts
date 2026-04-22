"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { logAction } from "@/lib/audit/log";
import { AuditAction } from "@/lib/audit/actions";
import type {
  CreatePlanTemplateData,
  PlanTaskTemplate,
  UpdatePlanTemplateData,
} from "@/lib/types/plan";

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

function validateTemplateData(
  data: CreatePlanTemplateData | UpdatePlanTemplateData
): { ok: true; value: UpdatePlanTemplateData } | { ok: false; error: string } {
  const next: UpdatePlanTemplateData = {};

  if ("title" in data) {
    const title = data.title?.trim();
    if (!title) return { ok: false, error: "Title is required." };
    next.title = title;
  }

  if ("description" in data) {
    next.description = data.description?.trim() ?? "";
  }

  if ("content_url" in data) {
    const contentUrl = data.content_url?.trim() ?? "";
    if (contentUrl) {
      try {
        new URL(contentUrl);
      } catch {
        return { ok: false, error: "Content URL must be a valid URL." };
      }
    }
    next.content_url = contentUrl;
  }

  if ("days_from_arrival" in data) {
    if (
      typeof data.days_from_arrival !== "number" ||
      !Number.isInteger(data.days_from_arrival)
    ) {
      return { ok: false, error: "Days from arrival must be a whole number." };
    }
    next.days_from_arrival = data.days_from_arrival;
  }

  if ("display_order" in data) {
    if (
      typeof data.display_order !== "number" ||
      !Number.isInteger(data.display_order) ||
      data.display_order < 0
    ) {
      return { ok: false, error: "Display order must be 0 or greater." };
    }
    next.display_order = data.display_order;
  }

  if ("phase" in data && data.phase) {
    next.phase = data.phase;
  }

  if ("tier_required" in data && data.tier_required) {
    next.tier_required = data.tier_required;
  }

  return { ok: true, value: next };
}

export async function createPlanTemplate(
  data: CreatePlanTemplateData
): Promise<ActionResult> {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return { success: false, error: auth.error };

    const validated = validateTemplateData(data);
    if (!validated.ok) return { success: false, error: validated.error };

    const service = createServiceClient();
    const { count } = await service
      .from("plan_task_templates")
      .select("*", { count: "exact", head: true })
      .eq("phase", validated.value.phase!);

    const payload = {
      title: validated.value.title!,
      description: validated.value.description || null,
      phase: validated.value.phase!,
      days_from_arrival: validated.value.days_from_arrival!,
      content_url: validated.value.content_url || null,
      tier_required: validated.value.tier_required!,
      display_order: count ?? 0,
    };

    const { data: inserted, error } = await service
      .from("plan_task_templates")
      .insert(payload)
      .select("id")
      .single();

    if (error) return { success: false, error: error.message };

    void logAction({
      actorId: auth.adminId,
      actorEmail: auth.adminEmail,
      action: AuditAction.ADMIN_PLAN_TEMPLATE_CREATED,
      targetId: (inserted as { id: string }).id,
      payload,
    });

    revalidatePath("/admin/plan-templates");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function updatePlanTemplate(
  id: string,
  data: UpdatePlanTemplateData
): Promise<ActionResult> {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return { success: false, error: auth.error };

    const validated = validateTemplateData(data);
    if (!validated.ok) return { success: false, error: validated.error };

    if (Object.keys(validated.value).length === 0) {
      return { success: true };
    }

    const updatePayload = {
      ...validated.value,
      description:
        validated.value.description === undefined
          ? undefined
          : validated.value.description || null,
      content_url:
        validated.value.content_url === undefined
          ? undefined
          : validated.value.content_url || null,
    };

    const service = createServiceClient();
    const { error } = await service
      .from("plan_task_templates")
      .update(updatePayload)
      .eq("id", id);

    if (error) return { success: false, error: error.message };

    void logAction({
      actorId: auth.adminId,
      actorEmail: auth.adminEmail,
      action: AuditAction.ADMIN_PLAN_TEMPLATE_UPDATED,
      targetId: id,
      payload: updatePayload as Record<string, unknown>,
    });

    revalidatePath("/admin/plan-templates");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function deletePlanTemplate(id: string): Promise<ActionResult> {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return { success: false, error: auth.error };

    const service = createServiceClient();
    const { data: existing } = await service
      .from("plan_task_templates")
      .select(
        "id, title, description, phase, days_from_arrival, content_url, tier_required, display_order, created_at, updated_at"
      )
      .eq("id", id)
      .maybeSingle();

    const template = existing as PlanTaskTemplate | null;
    if (!template) return { success: false, error: "Template not found." };

    const { error } = await service
      .from("plan_task_templates")
      .delete()
      .eq("id", id);

    if (error) return { success: false, error: error.message };

    void logAction({
      actorId: auth.adminId,
      actorEmail: auth.adminEmail,
      action: AuditAction.ADMIN_PLAN_TEMPLATE_DELETED,
      targetId: id,
      payload: {
        title: template.title,
        phase: template.phase,
        tier_required: template.tier_required,
      },
    });

    revalidatePath("/admin/plan-templates");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function savePlanTemplateOrder(
  updates: { id: string; display_order: number }[]
): Promise<ActionResult> {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return { success: false, error: auth.error };

    if (updates.length === 0) return { success: true };

    const service = createServiceClient();
    const results = await Promise.all(
      updates.map((update, index) =>
        service
          .from("plan_task_templates")
          .update({ display_order: index })
          .eq("id", update.id)
      )
    );

    const failed = results.find((result) => result.error);
    if (failed?.error) return { success: false, error: failed.error.message };

    void logAction({
      actorId: auth.adminId,
      actorEmail: auth.adminEmail,
      action: AuditAction.ADMIN_PLAN_TEMPLATE_REORDERED,
      payload: {
        template_ids: updates.map((update) => update.id),
      },
    });

    revalidatePath("/admin/plan-templates");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
