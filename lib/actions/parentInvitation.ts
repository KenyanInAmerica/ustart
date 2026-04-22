// Server actions for the parent invitation flow on the Parent Pack page.
// Students invite a parent by email; the parent receives a confirmation URL
// that leads to /invite, where the magic link is generated on-demand when
// the parent clicks Accept. This prevents Gmail's pre-fetch bot from consuming
// the one-time Supabase token before the parent clicks.

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { logAction } from "@/lib/audit/log";
import { AuditAction } from "@/lib/audit/actions";
import { resend } from "@/lib/resend/client";
import { parentInvitationEmail } from "@/lib/resend/templates/parentInvitation";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Fetches the student's display name from profiles for use in the invitation email.
// Falls back to "Your student" if the profile row is missing or the name is not set.
async function getStudentName(studentId: string): Promise<string> {
  const service = createServiceClient();
  const { data } = await service
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", studentId)
    .maybeSingle();
  const p = data as { first_name: string | null; last_name: string | null } | null;
  return (
    [p?.first_name, p?.last_name].filter(Boolean).join(" ") || "Your student"
  );
}

// Sends the invitation email via Resend. The inviteUrl is a plain confirmation
// page URL — no magic link is embedded in the email, so there is nothing for
// Gmail's pre-fetch bot to consume.
async function sendInvitationEmail(
  parentEmail: string,
  studentName: string,
  inviteUrl: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error: emailError } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: parentEmail,
    subject: "You've been invited to UStart",
    html: parentInvitationEmail({ studentName, inviteUrl }),
  });

  if (emailError) {
    console.error("[parentInvitation] Resend send failed:", emailError);
    return { ok: false, error: "Failed to send invitation email." };
  }

  return { ok: true };
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
    const { data: existing } = await supabase
      .from("parent_invitations")
      .select("id")
      .eq("student_id", user.id)
      .in("status", ["pending", "accepted"])
      .single();

    if (existing) {
      return { success: false, error: "An active invitation already exists." };
    }

    // Generate a token and expiry for the confirmation page URL.
    // The magic link is NOT generated here — it is generated on-demand in
    // acceptInvitation() when the parent actually clicks Accept.
    const inviteToken = crypto.randomUUID();
    const inviteTokenExpiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
    const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/invite?token=${inviteToken}`;

    // Send the email before inserting the DB row — if Resend fails nothing is
    // committed and the user can retry without hitting the duplicate-invitation guard.
    const studentName = await getStudentName(user.id);
    const sendResult = await sendInvitationEmail(parentEmail, studentName, inviteUrl);
    if (!sendResult.ok) return { success: false, error: sendResult.error };

    const { error: insertError } = await supabase
      .from("parent_invitations")
      .insert({
        student_id: user.id,
        parent_email: parentEmail,
        status: "pending",
        invite_token: inviteToken,
        invite_token_expires_at: inviteTokenExpiresAt,
      });

    if (insertError) return { success: false, error: insertError.message };

    void logAction({
      actorId: user.id,
      actorEmail: user.email ?? undefined,
      action: AuditAction.PARENT_INVITATION_SENT,
      targetEmail: parentEmail,
    });

    revalidatePath("/dashboard/content/parent-pack");
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
    const inv = invitation as { id: string; parent_email: string };

    // Generate a fresh token so the old confirmation URL is invalidated.
    const inviteToken = crypto.randomUUID();
    const inviteTokenExpiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
    const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/invite?token=${inviteToken}`;

    const studentName = await getStudentName(user.id);
    const sendResult = await sendInvitationEmail(inv.parent_email, studentName, inviteUrl);
    if (!sendResult.ok) return { success: false, error: sendResult.error };

    // Refresh the token columns and invited_at so the parent knows a new link was issued
    // and the old token is no longer accepted.
    await supabase
      .from("parent_invitations")
      .update({
        invite_token: inviteToken,
        invite_token_expires_at: inviteTokenExpiresAt,
        invited_at: new Date().toISOString(),
      })
      .eq("id", inv.id);

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

    revalidatePath("/dashboard/content/parent-pack");
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

    revalidatePath("/dashboard/content/parent-pack");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// Accepts a parent invitation: creates the parent user in Supabase Auth and sends
// a standard PKCE magic link email. Called when the parent clicks Accept on /invite.
// No auth check — intentionally accessible to unauthenticated parents.
export async function acceptInvitation(
  token: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const service = createServiceClient();

    // Step 1 — validate the invite token.
    const { data: invitation } = await service
      .from("parent_invitations")
      .select("id, parent_email, student_id")
      .eq("invite_token", token)
      .eq("status", "pending")
      .gt("invite_token_expires_at", new Date().toISOString())
      .maybeSingle();

    if (!invitation) {
      return { success: false, error: "This invitation link has expired or is no longer valid." };
    }

    const inv = invitation as { id: string; parent_email: string; student_id: string };

    // Step 2 — create the parent user in Supabase Auth, pre-confirmed, with linking
    // metadata embedded so the /auth/callback can perform the parent-linking step.
    // If the email already exists (previous invitation or re-invite), update metadata.
    const { error: createError } = await service.auth.admin.createUser({
      email: inv.parent_email,
      email_confirm: true,
      user_metadata: { role: "parent", student_id: inv.student_id },
    });

    if (createError) {
      // "already registered" is recoverable — the parent may have accepted a prior
      // invitation or signed up independently. Update their metadata and proceed.
      const isAlreadyExists =
        createError.message?.toLowerCase().includes("already") ||
        (createError as unknown as Record<string, unknown>).code === "email_exists";

      if (!isAlreadyExists) {
        console.error("[acceptInvitation] createUser failed:", createError);
        return { success: false, error: "Failed to set up your account. Please try again." };
      }

      // Look up the existing user's ID to update their metadata.
      const { data: existingRow } = await service
        .from("user_access")
        .select("id")
        .eq("email", inv.parent_email)
        .maybeSingle();

      if (!existingRow) {
        return { success: false, error: "Failed to set up your account. Please try again." };
      }

      const { id: existingUserId } = existingRow as { id: string };
      await service.auth.admin.updateUserById(existingUserId, {
        user_metadata: { role: "parent", student_id: inv.student_id },
      });
    }

    // Step 3 — send the magic link via the standard PKCE-compatible signInWithOtp.
    // Using the server client (anon key), NOT the service client, so Supabase routes
    // the email through the configured SMTP provider (Resend) and issues a PKCE token
    // that the existing /auth/callback code exchange can handle.
    const supabase = createClient();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: inv.parent_email,
      options: {
        shouldCreateUser: false, // user was created (or confirmed existing) in step 2
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });

    if (otpError) {
      console.error("[acceptInvitation] signInWithOtp failed:", otpError);
      return { success: false, error: "Failed to send sign-in email. Please try again." };
    }

    // Intentionally do NOT mark the invitation as accepted here — that happens in
    // the existing /auth/callback flow once Supabase confirms sign-in via user_metadata.
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
