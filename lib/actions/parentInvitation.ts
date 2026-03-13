"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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
        // /auth/callback passes the code through to /auth/confirm, which only
        // calls exchangeCodeForSession when the parent clicks the button — prevents
        // email pre-fetchers (Gmail, Outlook) from consuming the code early.
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

    if (otpError) return { success: false, error: otpError.message };

    // Refresh invited_at so the parent knows a new link was issued.
    await supabase
      .from("parent_invitations")
      .update({ invited_at: new Date().toISOString() })
      .eq("id", invitation.id);

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

    // Find the linked parent profile — may already be absent if cleaned up externally.
    const { data: parentProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("student_id", user.id)
      .eq("role", "parent")
      .maybeSingle();

    // Reset the parent's profile if found — non-fatal if absent.
    if (parentProfile) {
      await supabase
        .from("profiles")
        .update({ student_id: null, role: "student" })
        .eq("id", parentProfile.id);
    }

    // Cancel the accepted invitation row so the student can invite again.
    // Filter by status = 'accepted' to avoid touching already-cancelled rows.
    const { error: invitationError } = await supabase
      .from("parent_invitations")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("student_id", user.id)
      .eq("status", "accepted");

    if (invitationError) {
      return { success: false, error: "Failed to update invitation status." };
    }

    revalidatePath("/dashboard/parent-pack");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
