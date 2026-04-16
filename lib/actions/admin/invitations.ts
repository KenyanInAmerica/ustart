// Server actions for the admin parent invitations panel.
// Provides manual parent-linking as a replacement for direct SQL workarounds.
// Uses the service client throughout since all operations cross user boundaries.

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { logAction } from "@/lib/audit/log";
import { AuditAction } from "@/lib/audit/actions";
import { resend } from "@/lib/resend/client";
import { parentInvitationEmail } from "@/lib/resend/templates/parentInvitation";

type ActionResult = { success: true } | { success: false; error: string };

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

// Manually links a parent account to a student via the same pending-invitation flow
// used by students. The admin creates the account; the parent still signs in themselves
// via the /invite confirmation page before their profile is linked.
//
// ORDER OF OPERATIONS — all three validation checks (steps 1–3) complete before any
// database write occurs. If any validation fails the function returns early with no
// side-effects. Mutations only begin at step 4.
//
//   1. Validate student email — must exist in profiles with role = 'student'.
//   2. Confirm student does not already have an accepted parent invitation.
//   3. Confirm parent email does not already exist in auth.users.
//   ── no DB writes above this line ──────────────────────────────────────────────────
//   4a. Create the parent auth account with user_metadata for the callback to use.
//   4b. Cancel any existing pending or accepted invitation for the student.
//   4c. Insert the new pending invitation row with an invite token.
//   4d. Send the invitation email with the /invite confirmation page URL.
export async function adminLinkParent(
  studentEmail: string,
  parentEmail: string
): Promise<ActionResult> {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return { success: false, error: auth.error };

    if (!EMAIL_REGEX.test(studentEmail) || !EMAIL_REGEX.test(parentEmail)) {
      return { success: false, error: "Please enter valid email addresses." };
    }

    if (studentEmail.toLowerCase() === parentEmail.toLowerCase()) {
      return { success: false, error: "Student and parent emails must be different." };
    }

    const service = createServiceClient();

    // 1. Validate student: must exist in profiles with role = 'student'.
    // Also select is_admin — an account can have role='student' and is_admin=true
    // simultaneously, and admin accounts must not be treated as linkable students.
    const { data: studentRow } = await service
      .from("profiles")
      .select("id, role, is_admin, first_name, last_name")
      .eq("email", studentEmail.toLowerCase())
      .maybeSingle();

    const student = studentRow as {
      id: string;
      role: string | null;
      is_admin: boolean | null;
      first_name: string | null;
      last_name: string | null;
    } | null;
    if (!student) {
      return { success: false, error: "The student email you entered does not match any existing account." };
    }
    if (student.role !== "student" || student.is_admin) {
      return { success: false, error: "The student email you entered belongs to an admin account, not a student account." };
    }

    // 2. Student must not already have an accepted parent invitation.
    const { data: existingInvitation } = await service
      .from("parent_invitations")
      .select("id")
      .eq("student_id", student.id)
      .eq("status", "accepted")
      .maybeSingle();

    if (existingInvitation) {
      return { success: false, error: "The student you entered already has a linked parent account." };
    }

    // 3. Parent email must not already exist in auth.users — only new accounts are
    // created here; use a separate flow to link an existing account.
    // Use a large perPage to avoid missing the email on paginated results.
    const { data: existingUsers } = await service.auth.admin.listUsers({ perPage: 1000 });
    const existingParent = existingUsers?.users.find(
      (u) => u.email?.toLowerCase() === parentEmail.toLowerCase()
    );
    if (existingParent) {
      return {
        success: false,
        error:
          "The parent email you entered already belongs to an existing account. Please use a new email address for the parent account.",
      };
    }

    // 4a. Create the parent auth account with user_metadata so the /auth/callback
    // can perform profile linking when the parent signs in via magic link.
    const { data: newUser, error: createError } = await service.auth.admin.createUser({
      email: parentEmail.toLowerCase(),
      email_confirm: true,
      user_metadata: { role: "parent", student_id: student.id },
    });

    if (createError || !newUser?.user) {
      return { success: false, error: createError?.message ?? "Failed to create parent account." };
    }

    const parentId = newUser.user.id;

    // 4b. Cancel any existing pending or accepted invitation for the student.
    // Must run before the insert — the partial unique index on (student_id) WHERE
    // status IN ('pending','accepted') would block a new pending row while an
    // active row already exists.
    await service
      .from("parent_invitations")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("student_id", student.id)
      .in("status", ["pending", "accepted"]);

    // 4c. Insert the new pending invitation row with an invite token.
    // The token is emailed to the parent; the invite page validates it before
    // calling acceptInvitation() which sends the magic link.
    const inviteToken = crypto.randomUUID();
    const inviteTokenExpiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();

    const { error: invError } = await service.from("parent_invitations").insert({
      student_id: student.id,
      parent_email: parentEmail.toLowerCase(),
      status: "pending",
      invite_token: inviteToken,
      invite_token_expires_at: inviteTokenExpiresAt,
      invited_at: new Date().toISOString(),
    });

    if (invError) {
      // Roll back the auth account so the admin can retry cleanly.
      await service.auth.admin.deleteUser(parentId);
      return { success: false, error: invError.message };
    }

    // 4d. Email the parent the /invite confirmation page URL.
    // Sending a plain confirmation URL (not a raw magic link) so there is nothing
    // for Gmail's pre-fetch bot to consume before the parent clicks.
    const studentName =
      [student.first_name, student.last_name].filter(Boolean).join(" ") || studentEmail;
    const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/invite?token=${inviteToken}`;

    const { error: emailError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: parentEmail.toLowerCase(),
      subject: "You've been invited to UStart",
      html: parentInvitationEmail({ studentName, inviteUrl }),
    });

    if (emailError) {
      console.error("[adminLinkParent] Resend send failed:", emailError);
      // Roll back both the auth account and the invitation row.
      await service.auth.admin.deleteUser(parentId);
      await service
        .from("parent_invitations")
        .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
        .eq("student_id", student.id)
        .eq("status", "pending");
      return { success: false, error: "Failed to send invitation email to parent." };
    }

    void logAction({
      actorId: auth.adminId,
      actorEmail: auth.adminEmail,
      action: AuditAction.ADMIN_PARENT_MANUALLY_LINKED,
      targetId: student.id,
      targetEmail: studentEmail.toLowerCase(),
      payload: { parentEmail: parentEmail.toLowerCase(), flow: "pending_invitation" },
    });

    revalidatePath("/admin/invitations");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
