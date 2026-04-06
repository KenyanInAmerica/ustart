// Server actions for admin account management.
// Admins can grant or revoke admin access by email.
// An admin cannot revoke their own access — enforced server-side.

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { logAction } from "@/lib/audit/log";
import { AuditAction } from "@/lib/audit/actions";

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

// Grants admin access to a user identified by email.
// The user must already have an account — admin access is not bootstrapped here.
export async function grantAdminAccess(email: string): Promise<ActionResult> {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return { success: false, error: auth.error };

    const service = createServiceClient();

    // Look up the user ID by email.
    const { data: userRow } = await service
      .from("user_access")
      .select("id")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    const target = userRow as { id: string } | null;
    if (!target) {
      return { success: false, error: "No account found for that email address." };
    }

    const { error } = await service
      .from("profiles")
      .update({ is_admin: true })
      .eq("id", target.id);

    if (error) return { success: false, error: error.message };

    void logAction({
      actorId: auth.adminId,
      actorEmail: auth.adminEmail,
      action: AuditAction.ADMIN_ACCESS_GRANTED,
      targetEmail: email.toLowerCase(),
    });

    revalidatePath("/admin/admins");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// Revokes admin access from a user by their profile ID.
// An admin cannot revoke their own access.
export async function revokeAdminAccess(targetUserId: string): Promise<ActionResult> {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return { success: false, error: auth.error };

    // Prevent self-revocation.
    if (targetUserId === auth.adminId) {
      return { success: false, error: "You cannot revoke your own admin access." };
    }

    const service = createServiceClient();

    // Fetch the target email for the audit log alongside the update.
    const { data: targetProfile } = await service
      .from("profiles")
      .select("email")
      .eq("id", targetUserId)
      .maybeSingle();
    const targetEmail = (targetProfile as { email: string | null } | null)?.email ?? undefined;

    const { error } = await service
      .from("profiles")
      .update({ is_admin: false })
      .eq("id", targetUserId);

    if (error) return { success: false, error: error.message };

    void logAction({
      actorId: auth.adminId,
      actorEmail: auth.adminEmail,
      action: AuditAction.ADMIN_ACCESS_REVOKED,
      targetId: targetUserId,
      targetEmail,
    });

    revalidatePath("/admin/admins");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
