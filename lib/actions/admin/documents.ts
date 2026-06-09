"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { AuditAction } from "@/lib/audit/actions";
import { logAction } from "@/lib/audit/log";
import { resend } from "@/lib/resend/client";
import { fetchUserDocumentSubmissions } from "@/lib/admin/data";
import type { DocumentSubmission } from "@/lib/types/documents";

type ReviewStatus = "approved" | "resubmit_requested";
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

export async function adminReviewSubmission(
  submissionId: string,
  review: {
    status: ReviewStatus;
    comment?: string;
  }
): Promise<ActionResult> {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return { success: false, error: auth.error };

    if (
      review.status !== "approved" &&
      review.status !== "resubmit_requested"
    ) {
      return { success: false, error: "Invalid review status." };
    }

    const comment = review.comment?.trim() ?? "";
    if (review.status === "resubmit_requested" && !comment) {
      return {
        success: false,
        error: "A comment is required when requesting resubmission.",
      };
    }

    const service = createServiceClient();
    const { data: submissionData, error: fetchError } = await service
      .from("document_submissions")
      .select("id, user_id, section_label")
      .eq("id", submissionId)
      .maybeSingle();

    if (fetchError) return { success: false, error: fetchError.message };

    const submission = submissionData as {
      id: string;
      user_id: string;
      section_label: string | null;
    } | null;

    if (!submission) return { success: false, error: "Submission not found." };

    const { error: updateError } = await service
      .from("document_submissions")
      .update({
        status: review.status,
        admin_comment: comment || null,
        reviewed_by: auth.adminId,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", submissionId);

    if (updateError) return { success: false, error: updateError.message };

    const { data: profileData } = await service
      .from("profiles")
      .select("email, first_name, last_name")
      .eq("id", submission.user_id)
      .maybeSingle();

    const profile = profileData as {
      email: string | null;
      first_name: string | null;
      last_name: string | null;
    } | null;

    if (profile?.email) {
      const section = submission.section_label ?? "General";
      const isApproved = review.status === "approved";
      const message = isApproved
        ? `Your document submission for ${section} has been approved by the UStart team.`
        : `Your document submission for ${section} needs to be resubmitted.`;

      try {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL!,
          to: profile.email,
          subject: isApproved
            ? "Your document has been approved"
            : "Please resubmit your document",
          html: `
            <p>Hi ${profile.first_name ?? "there"},</p>
            <p>${message}</p>
            ${comment ? `<p><strong>Comment:</strong> ${comment}</p>` : ""}
          `,
        });
      } catch (emailError) {
        console.error("[adminReviewSubmission] Resend send failed:", emailError);
      }
    }

    void logAction({
      actorId: auth.adminId,
      actorEmail: auth.adminEmail,
      action: AuditAction.ADMIN_DOCUMENT_REVIEWED,
      targetId: submission.user_id,
      payload: {
        submission_id: submissionId,
        status: review.status,
      },
    });

    revalidatePath("/admin/users");
    revalidatePath("/admin/documents");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function adminFetchUserDocumentSubmissions(
  userId: string
): Promise<DocumentSubmission[]> {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) {
      console.error("[adminFetchUserDocumentSubmissions] auth failed:", auth.error);
      throw new Error(auth.error);
    }
    return await fetchUserDocumentSubmissions(userId);
  } catch (error) {
    console.error("[adminFetchUserDocumentSubmissions] fetch failed:", error);
    throw error;
  }
}
