// Server action for admin settings.
// Currently covers: WhatsApp invite link stored in the config table.

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

type ActionResult = { success: true } | { success: false; error: string };

async function requireAdmin(): Promise<
  { ok: true } | { ok: false; error: string }
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

  return { ok: true };
}

// Saves the WhatsApp invite link to the config table.
// Uses upsert so it works whether or not the row already exists.
export async function saveWhatsappLink(link: string): Promise<ActionResult> {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return { success: false, error: auth.error };

    const trimmed = link.trim();
    if (!trimmed) {
      return { success: false, error: "Link cannot be empty." };
    }

    const service = createServiceClient();
    const { error } = await service
      .from("config")
      .upsert(
        { key: "whatsapp_invite_link", value: trimmed },
        { onConflict: "key" }
      );

    if (error) return { success: false, error: error.message };

    // Revalidate both admin settings and the user-facing dashboard
    // so the new link is reflected immediately.
    revalidatePath("/admin/settings");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
