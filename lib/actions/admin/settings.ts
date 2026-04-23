// Server action for admin settings.
// Currently covers: WhatsApp invite link stored in the config table.

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { logAction } from "@/lib/audit/log";
import { AuditAction } from "@/lib/audit/actions";

type ActionResult = { success: true } | { success: false; error: string };
type SettingsInput = {
  whatsappInviteLink: string;
  parentPackNotionUrl: string;
  parentContentNotionUrl: string;
};

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

// Saves admin-managed config values to the config table.
// Uses upsert so it works whether or not the rows already exist.
export async function saveAdminSettings(settings: SettingsInput): Promise<ActionResult> {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return { success: false, error: auth.error };

    const trimmed = {
      whatsappInviteLink: settings.whatsappInviteLink.trim(),
      parentPackNotionUrl: settings.parentPackNotionUrl.trim(),
      parentContentNotionUrl: settings.parentContentNotionUrl.trim(),
    };

    if (
      !trimmed.whatsappInviteLink ||
      !trimmed.parentPackNotionUrl ||
      !trimmed.parentContentNotionUrl
    ) {
      return { success: false, error: "All settings fields are required." };
    }

    const service = createServiceClient();
    const { error } = await service
      .from("config")
      .upsert(
        [
          { key: "whatsapp_invite_link", value: trimmed.whatsappInviteLink },
          { key: "parent_pack_notion_url", value: trimmed.parentPackNotionUrl },
          { key: "parent_content_notion_url", value: trimmed.parentContentNotionUrl },
        ],
        { onConflict: "key" }
      );

    if (error) return { success: false, error: error.message };

    void logAction({
      actorId: auth.adminId,
      actorEmail: auth.adminEmail,
      action: AuditAction.ADMIN_SETTINGS_UPDATED,
      payload: {
        keys: [
          "whatsapp_invite_link",
          "parent_pack_notion_url",
          "parent_content_notion_url",
        ],
      },
    });

    // Revalidate both admin settings and the user-facing dashboard
    // so the new link is reflected immediately.
    revalidatePath("/admin/settings");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function saveWhatsappLink(link: string): Promise<ActionResult> {
  return saveAdminSettings({
    whatsappInviteLink: link,
    parentPackNotionUrl: "https://notion.so/placeholder",
    parentContentNotionUrl: "https://notion.so/placeholder",
  });
}
