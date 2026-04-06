// Server actions for the parent invitation flow on the Parent Pack page.
// Students invite a parent by email; the parent receives a magic link that signs
// them in and links their account to the student's entitlements.

"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { logAction } from "@/lib/audit/log";
import { AuditAction } from "@/lib/audit/actions";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Derives the site origin from request headers — works in dev and on Vercel.
function getSiteUrl(): string {
  const h = headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function sendParentInvitation(
  parentEmail: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated." };

    if (!EMAIL_REGEX.test(parentEmail)) {
      return { success: false, error: "Please enter a valid email address." };
    }

    // Validate that the invited email doesn't belong to an account that would be
    // corrupted by the invitation. Use the service client to bypass RLS and check
    // across all users — the regular client can only see the current user's data.
    const service = createServiceClient();
    const { data: existingUserRow } = await service
      .from("user_access")
      .select("id")
      .eq("email", parentEmail)
      .maybeSingle();

    if (existingUserRow) {
      const raw = existingUserRow as { id: string };
      const { data: existingProfile } = await service
        .from("profiles")
        .select("role, student_id")
        .eq("id", raw.id)
        .maybeSingle();

      const profile = existingProfile as { role: string | null; student_id: string | null } | null;
      if (profile) {
        const existingRole = profile.role ?? "student";

        // Inviting an existing student would overwrite their profile and destroy access.
        if (existingRole === "student") {
          return { success: false, error: "This email belongs to an existing student account and cannot be invited as a parent." };
        }

        // Inviting a parent already linked to a different student would re-link them.
        if (existingRole === "parent" && profile.student_id !== null && profile.student_id !== user.id) {
          return { success: false, error: "This parent account is already linked to another student." };
        }
      }
    }

    // Prevent duplicate active invitations — one parent per student at a time.
    // .single() is intentional: if the partial unique index allows multiple active
    // rows (shouldn't happen), we still treat that as a block.
    const { data: existing } = await supabase
      .from("parent_invitations")
      .select("id")
      .eq("student_id", user.id)
      .in("status", ["pending", "accepted"])
      .single();

    if (existing) {
      return { success: false, error: "An active invitation already exists." };
    }

    // Send the magic link before inserting the DB row — if the OTP call fails
    // nothing is committed and the user can try again without hitting the
    // duplicate-invitation guard above.
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: parentEmail,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${getSiteUrl()}/auth/callback`,
        data: { student_id: user.id, role: "parent" },
      },
    });

    if (otpError) {
      return { success: false, error: "Failed to send invitation email. Please try again shortly." };
    }

    // OTP succeeded — now record the pending invitation so the dashboard
    // can display the correct state.
    const { error: insertError } = await supabase
      .from("parent_invitations")
      .insert({ student_id: user.id, parent_email: parentEmail, status: "pending" });

    if (insertError) return { success: false, error: insertError.message };

    void logAction({
      actorId: user.id,
      actorEmail: user.email ?? undefined,
      action: AuditAction.PARENT_INVITATION_SENT,
      targetEmail: parentEmail,
    });

    revalidatePath("/dashboard/parent-pack");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function resendParentInvitation(): Promise<
  { success: true } | { success: false; error: string }
> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated." };

    const { data: invitation } = await supabase
      .from("parent_invitations")
      .select("id, parent_email")
      .eq("student_id", user.id)
      .eq("status", "pending")
      .maybeSingle();

    if (!invitation) return { success: false, error: "No pending invitation found." };

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: invitation.parent_email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${getSiteUrl()}/auth/callback`,
        data: { student_id: user.id, role: "parent" },
      },
    });

    if (otpError) return { success: false, error: "Failed to send invitation email. Please try again shortly." };

    // Refresh invited_at so the parent knows a new link was issued.
    await supabase
      .from("parent_invitations")
      .update({ invited_at: new Date().toISOString() })
      .eq("id", invitation.id);

    void logAction({
      actorId: user.id,
      actorEmail: user.email ?? undefined,
      action: AuditAction.PARENT_INVITATION_RESENT,
      targetEmail: (invitation as { parent_email: string }).parent_email,
    });

    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function cancelParentInvitation(): Promise<
  { success: true } | { success: false; error: string }
> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated." };

    const { error } = await supabase
      .from("parent_invitations")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("student_id", user.id)
      .eq("status", "pending");

    if (error) return { success: false, error: error.message };

    void logAction({
      actorId: user.id,
      actorEmail: user.email ?? undefined,
      action: AuditAction.PARENT_INVITATION_CANCELLED,
    });

    revalidatePath("/dashboard/parent-pack");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function unlinkParent(): Promise<
  { success: true } | { success: false; error: string }
> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated." };

    // Initialise the service client here — RLS prevents the regular client from
    // reading another user's profile row, so the profiles query must use service role.
    const service = createServiceClient();

    // Find the linked parent profile — may already be absent if cleaned up externally.
    const { data: parentProfile } = await service
      .from("profiles")
      .select("id")
      .eq("student_id", user.id)
      .eq("role", "parent")
      .maybeSingle();

    // Delete the parent's auth.users row via the service role — RLS prevents the
    // regular client from deleting another user's account. Deleting from auth.users
    // cascades and removes the profiles row automatically, and destroys the
    // raw_user_meta_data that would otherwise re-link the parent on a future sign-in.
    if (parentProfile) {
      const raw = parentProfile as { id: string };
      const { error: deleteError } = await service.auth.admin.deleteUser(raw.id);
      if (deleteError) {
        return { success: false, error: "Failed to remove parent account." };
      }
      // TODO: notify parent via Resend that their account has been removed
    }

    // Cancel the accepted invitation row so the student can invite again.
    // The parent account no longer exists so the same email can be re-invited immediately.
    const { error: invitationError } = await supabase
      .from("parent_invitations")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("student_id", user.id)
      .eq("status", "accepted");

    if (invitationError) {
      return { success: false, error: "Failed to update invitation status." };
    }

    void logAction({
      actorId: user.id,
      actorEmail: user.email ?? undefined,
      action: AuditAction.PARENT_UNLINKED,
    });

    revalidatePath("/dashboard/parent-pack");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
