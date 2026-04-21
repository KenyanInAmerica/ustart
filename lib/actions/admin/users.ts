// Server actions for admin user management.
// All mutations use the service client to bypass RLS.
// Table mapping (from schema):
//   memberships         — one-time tier purchases (lite, explore, concierge)
//   one_time_purchases  — lifetime add-on purchases; type column holds 'parent_seat'
//   addons              — purchasable call products; type column holds arrival/support calls only

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { fetchAdminUsers, fetchUserAssignments } from "@/lib/admin/data";
import { logAction } from "@/lib/audit/log";
import { AuditAction } from "@/lib/audit/actions";
import type { UserContentItem } from "@/types/admin";

type ActionResult = { success: true } | { success: false; error: string };

// Verifies the calling user is an admin. Returns the admin's user ID and email on success.
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

// Assigns or replaces a user's membership tier. Pass null to remove the plan.
// Writes to the memberships table which backs the membership_tier column in user_access.
export async function setUserMembershipTier(
  userId: string,
  tier: "lite" | "explore" | "concierge" | null
): Promise<ActionResult> {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return { success: false, error: auth.error };

    const service = createServiceClient();

    if (tier === null) {
      // Remove any existing membership row for this user.
      const { error } = await service
        .from("memberships")
        .delete()
        .eq("user_id", userId);
      if (error) return { success: false, error: error.message };
    } else {
      // Upsert so an existing tier is replaced rather than duplicated.
      const { error } = await service
        .from("memberships")
        .upsert(
          { user_id: userId, tier, purchased_at: new Date().toISOString() },
          { onConflict: "user_id" }
        );
      if (error) return { success: false, error: error.message };
    }

    revalidatePath("/admin/users");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// Adds or removes an add-on for a user.
// parent_pack → one_time_purchases (type = 'parent_seat')
export async function setUserAddon(
  userId: string,
  addon: "parent_pack",
  enabled: boolean
): Promise<ActionResult> {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return { success: false, error: auth.error };

    const service = createServiceClient();

    // Parent Pack is a one-time purchase stored in one_time_purchases, type = 'parent_seat'.
    if (enabled) {
      // TODO: replace placeholder Stripe payment intent ID with real value from Stripe
      // webhook once Stripe integration is complete (Feature 12)
      const { error } = await service
        .from("one_time_purchases")
        .upsert(
          {
            user_id: userId,
            type: "parent_seat",
            purchased_at: new Date().toISOString(),
            stripe_payment_intent_id: "pi_placeholder",
          },
          { onConflict: "user_id,type", ignoreDuplicates: true }
        );
      if (error) return { success: false, error: error.message };
    } else {
      const { error } = await service
        .from("one_time_purchases")
        .delete()
        .eq("user_id", userId)
        .eq("type", "parent_seat");
      if (error) return { success: false, error: error.message };
    }

    revalidatePath("/admin/users");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// Assigns an individual content item (PDF) to a specific user.
export async function assignContentToUser(
  userId: string,
  contentItemId: string
): Promise<ActionResult> {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return { success: false, error: auth.error };

    const service = createServiceClient();

    // Fetch title for the audit log payload before inserting.
    const { data: contentItem } = await service
      .from("content_items")
      .select("title")
      .eq("id", contentItemId)
      .maybeSingle();
    const title = (contentItem as { title: string } | null)?.title ?? contentItemId;

    const { error } = await service
      .from("user_content_items")
      .upsert(
        { user_id: userId, content_item_id: contentItemId, assigned_by: auth.adminId },
        { onConflict: "user_id,content_item_id", ignoreDuplicates: true }
      );

    if (error) return { success: false, error: error.message };

    void logAction({
      actorId: auth.adminId,
      actorEmail: auth.adminEmail,
      action: AuditAction.ADMIN_CONTENT_ASSIGNED,
      targetId: userId,
      payload: { contentItemId, title },
    });

    revalidatePath("/admin/users");
    revalidatePath("/admin/content");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// Revokes an individually assigned content item from a user.
// If the content item was individually uploaded (is_individual_only = true),
// also deletes the content_items row and its Storage file — no other user
// will ever be assigned that item, so leaving it orphaned serves no purpose.
export async function revokeContentFromUser(
  assignmentId: string
): Promise<ActionResult> {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return { success: false, error: auth.error };

    const service = createServiceClient();

    // Fetch the assignment with enough content item data to decide on cleanup.
    const { data: assignmentData } = await service
      .from("user_content_items")
      .select("content_item_id, content_items(file_path, is_individual_only)")
      .eq("id", assignmentId)
      .maybeSingle();

    type RawAssignment = {
      content_item_id: string;
      content_items: { file_path: string; is_individual_only: boolean } | null;
    };
    const assignment = assignmentData as unknown as RawAssignment | null;

    // Delete the assignment row.
    const { error } = await service
      .from("user_content_items")
      .delete()
      .eq("id", assignmentId);

    if (error) return { success: false, error: error.message };

    // If the file was an individual-only upload, clean up the catalog row and
    // the Storage file so nothing is left orphaned.
    if (assignment?.content_items?.is_individual_only) {
      await service
        .from("content_items")
        .delete()
        .eq("id", assignment.content_item_id);
      await service.storage
        .from("pdfs")
        .remove([assignment.content_items.file_path]);
    }

    revalidatePath("/admin/users");
    revalidatePath("/admin/content");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// ── User Status ───────────────────────────────────────────────────────────────

// Restores a soft-deleted user by setting profiles.is_active = true.
// Guards against reactivating admin accounts as a sanity check, though admins
// should never have been deactivated in the first place.
export async function reactivateUser(userId: string): Promise<ActionResult> {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return { success: false, error: auth.error };

    const service = createServiceClient();

    // Fetch the target email for the audit log before mutating.
    const { data: targetProfile } = await service
      .from("profiles")
      .select("email")
      .eq("id", userId)
      .maybeSingle();
    const targetEmail = (targetProfile as { email: string | null } | null)?.email ?? undefined;

    const { error } = await service
      .from("profiles")
      .update({ is_active: true })
      .eq("id", userId);

    if (error) return { success: false, error: error.message };

    void logAction({
      actorId: auth.adminId,
      actorEmail: auth.adminEmail,
      action: AuditAction.ADMIN_USER_REACTIVATED,
      targetId: userId,
      targetEmail,
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// ── User Deletion ─────────────────────────────────────────────────────────────

// Soft-deletes a user by setting profiles.is_active = false.
// The middleware and sign-in flow already block inactive users from accessing
// the platform. This is the default deletion path in the admin UI.
export async function softDeleteUser(userId: string): Promise<ActionResult> {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return { success: false, error: auth.error };

    const service = createServiceClient();

    // Guard: never soft-delete an admin account. Also fetch email for audit log.
    const { data: target } = await service
      .from("profiles")
      .select("is_admin, email")
      .eq("id", userId)
      .maybeSingle();

    const t = target as { is_admin: boolean | null; email: string | null } | null;
    if (t?.is_admin) {
      return { success: false, error: "Admin accounts cannot be deleted." };
    }
    const targetEmail = t?.email ?? undefined;

    const { error } = await service
      .from("profiles")
      .update({ is_active: false })
      .eq("id", userId);

    if (error) return { success: false, error: error.message };

    // Cancel any pending parent invitations so a parent cannot complete the flow
    // and link to a deactivated account.
    await service
      .from("parent_invitations")
      .update({ status: "cancelled" })
      .eq("student_id", userId)
      .eq("status", "pending");

    void logAction({
      actorId: auth.adminId,
      actorEmail: auth.adminEmail,
      action: AuditAction.ADMIN_USER_SOFT_DELETED,
      targetId: userId,
      targetEmail,
      payload: { reason: "soft_delete" },
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// Hard-deletes a user from auth.users — Supabase cascades the deletion through
// all FK-linked tables (profiles, memberships, addons, one_time_purchases, etc.).
// Reserved for formal erasure requests. Cannot be undone.
export async function hardDeleteUser(userId: string): Promise<ActionResult> {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return { success: false, error: auth.error };

    const service = createServiceClient();

    // Guard: never hard-delete an admin account. Also fetch email for audit log
    // before deletion — auth.users cascade makes it unqueryable afterward.
    const { data: target } = await service
      .from("profiles")
      .select("is_admin, email")
      .eq("id", userId)
      .maybeSingle();

    const t = target as { is_admin: boolean | null; email: string | null } | null;
    if (t?.is_admin) {
      return { success: false, error: "Admin accounts cannot be deleted." };
    }
    const targetEmail = t?.email ?? undefined;

    // deleteUser uses the Admin API — requires service role key.
    const { error } = await service.auth.admin.deleteUser(userId);

    if (error) return { success: false, error: error.message };

    void logAction({
      actorId: auth.adminId,
      actorEmail: auth.adminEmail,
      action: AuditAction.ADMIN_USER_HARD_DELETED,
      targetId: userId,
      targetEmail,
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// Exposes fetchUserAssignments as a server action so client components can call it
// without receiving the function as a prop (which Next.js forbids for non-"use server" functions).
export async function getUserAssignments(userId: string): Promise<UserContentItem[]> {
  return fetchUserAssignments(userId);
}

// User search for the content section's individual assignment tool.
// Returns up to 25 matching users (name/email match) with only the fields needed for display.
export async function searchUsersForAssignment(
  search: string
): Promise<{ id: string; email: string; first_name: string | null; last_name: string | null; membership_tier: string | null }[]> {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return [];
    const { users } = await fetchAdminUsers(1, search);
    return users.map(({ id, email, first_name, last_name, membership_tier }) => ({
      id,
      email,
      first_name,
      last_name,
      membership_tier,
    }));
  } catch {
    return [];
  }
}
