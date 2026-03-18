// Server actions for the admin parent invitations panel.
// Provides manual parent-linking as a replacement for direct SQL workarounds.
// Uses the service client throughout since all operations cross user boundaries.

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

type ActionResult = { success: true } | { success: false; error: string };

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function requireAdmin(): Promise<
  { ok: true; adminId: string } | { ok: false; error: string }
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

  return { ok: true, adminId: user.id };
}

// Manually links a parent account to a student, bypassing the magic-link invitation flow.
//
// ORDER OF OPERATIONS — all three validation checks (steps 1–3) complete before any
// database write occurs. If any validation fails the function returns early with no
// side-effects. Mutations only begin at step 4.
//
//   1. Validate student email — must exist in profiles with role = 'student'.
//   2. Confirm student does not already have an accepted parent invitation.
//   3. Confirm parent email does not already exist in auth.users.
//   ── no DB writes above this line ──────────────────────────────────────────────────
//   4a. Create the parent auth account.
//   4b. Set role = "parent", email, and student_id on the parent's profile.
//   4c. Cancel any existing pending invitation for the student.
//   4d. Insert the new accepted invitation row.
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
      .select("id, role, is_admin")
      .eq("email", studentEmail.toLowerCase())
      .maybeSingle();

    const student = studentRow as { id: string; role: string | null; is_admin: boolean | null } | null;
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

    // 4a. Create a new auth account for the parent.
    // The parent can sign in via magic link afterward.
    const { data: newUser, error: createError } =
      await service.auth.admin.createUser({
        email: parentEmail.toLowerCase(),
        email_confirm: true,
      });

    if (createError || !newUser?.user) {
      return { success: false, error: createError?.message ?? "Failed to create parent account." };
    }

    const parentId = newUser.user.id;

    // 4b. Update the parent's profile with role = "parent", email, and student_id.
    // The handle_new_user trigger fires when createUser() is called above and creates
    // the profiles row automatically — use UPDATE, not upsert, to avoid conflict errors.
    const { error: profileError } = await service
      .from("profiles")
      .update({
        role: "parent",
        email: parentEmail.toLowerCase(),
        student_id: student.id,
      })
      .eq("id", parentId);

    if (profileError) return { success: false, error: profileError.message };

    // 4c. Cancel any existing pending invitation.
    // Must run before the insert — the partial unique index on (student_id) WHERE
    // status IN ('pending','accepted') would block inserting a new accepted row
    // while an active row already exists.
    await service
      .from("parent_invitations")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("student_id", student.id)
      .eq("status", "pending");

    // 4d. Insert the new accepted invitation row.
    // Plain INSERT, not upsert — the partial unique index cannot be used for
    // ON CONFLICT resolution and was causing the upsert to fail.
    const { error: invError } = await service.from("parent_invitations").insert({
      student_id: student.id,
      parent_email: parentEmail.toLowerCase(),
      status: "accepted",
      invited_at: new Date().toISOString(),
      accepted_at: new Date().toISOString(),
    });

    if (invError) return { success: false, error: invError.message };

    revalidatePath("/admin/invitations");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
