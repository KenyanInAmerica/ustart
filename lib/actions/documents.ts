"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { resend } from "@/lib/resend/client";
import type {
  DocumentSubmission,
  DocumentSubmissionFile,
} from "@/lib/types/documents";

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10_485_760;
const ALLOWED_FILE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

type SubmitDocumentResult =
  | { success: true; submissionId: string }
  | { success: false; error: string };

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function normalizeSubmission(row: DocumentSubmissionRow): DocumentSubmission {
  return {
    id: row.id,
    user_id: row.user_id,
    task_id: row.task_id,
    template_id: row.template_id,
    section_label: row.section_label,
    status: row.status,
    admin_comment: row.admin_comment,
    reviewed_by: row.reviewed_by,
    reviewed_at: row.reviewed_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    files: row.document_submission_files ?? row.files ?? [],
  };
}

type DocumentSubmissionRow = Omit<DocumentSubmission, "files"> & {
  document_submission_files?: DocumentSubmissionFile[] | null;
  files?: DocumentSubmissionFile[] | null;
};

async function cancelSupersededSubmissions({
  userId,
  submissionId,
  taskId,
  sectionLabel,
}: {
  userId: string;
  submissionId: string;
  taskId: string | null;
  sectionLabel: string | null;
}) {
  const service = createServiceClient();
  let query = service
    .from("document_submissions")
    .update({
      status: "cancelled",
      admin_comment: null,
      reviewed_by: null,
      reviewed_at: null,
    })
    .eq("user_id", userId)
    .neq("id", submissionId)
    .in("status", ["pending_review", "resubmit_requested"]);

  if (taskId) {
    query = query.eq("task_id", taskId);
  } else {
    query = query.is("task_id", null);
    query = sectionLabel
      ? query.eq("section_label", sectionLabel)
      : query.is("section_label", null);
  }

  const { error } = await query;
  if (error) {
    console.error("[documents] Failed to cancel superseded submissions:", error);
  }
}

export async function submitDocument(
  formData: FormData
): Promise<SubmitDocumentResult> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Not authenticated." };

    const taskId = stringOrNull(formData.get("taskId"));
    const templateId = stringOrNull(formData.get("templateId"));
    const sectionLabel = stringOrNull(formData.get("sectionLabel"));
    const files = formData
      .getAll("files")
      .filter((entry): entry is File => entry instanceof File && entry.size > 0);

    if (files.length === 0) {
      return { success: false, error: "At least one file is required." };
    }

    if (files.length > MAX_FILES) {
      return { success: false, error: "You can upload up to 5 files." };
    }

    const invalidFile = files.find((file) => {
      return file.size > MAX_FILE_SIZE || !ALLOWED_FILE_TYPES.has(file.type);
    });

    if (invalidFile) {
      if (invalidFile.size > MAX_FILE_SIZE) {
        return {
          success: false,
          error: `${invalidFile.name} is larger than 10MB.`,
        };
      }
      return {
        success: false,
        error: `${invalidFile.name} is not an accepted file type.`,
      };
    }

    const { data: submissionData, error: submissionError } = await supabase
      .from("document_submissions")
      .insert({
        user_id: user.id,
        task_id: taskId,
        template_id: templateId,
        section_label: sectionLabel,
      })
      .select("id")
      .single();

    if (submissionError) {
      return { success: false, error: submissionError.message };
    }

    const submissionId = (submissionData as { id: string }).id;
    const service = createServiceClient();

    const fileRows: Omit<DocumentSubmissionFile, "id" | "created_at">[] = [];
    for (const file of files) {
      const filePath = `${user.id}/${submissionId}/${Date.now()}_${sanitizeFileName(
        file.name
      )}`;
      const { error: uploadError } = await service.storage
        .from("submissions")
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) return { success: false, error: uploadError.message };

      fileRows.push({
        submission_id: submissionId,
        file_name: file.name,
        file_path: filePath,
        file_type: file.type,
        file_size: file.size,
      });
    }

    const { error: fileInsertError } = await supabase
      .from("document_submission_files")
      .insert(fileRows);

    if (fileInsertError) return { success: false, error: fileInsertError.message };

    await cancelSupersededSubmissions({
      userId: user.id,
      submissionId,
      taskId,
      sectionLabel,
    });

    try {
      const [{ data: profileData }, { data: taskData }] = await Promise.all([
        service
          .from("profiles")
          .select("first_name, last_name, email")
          .eq("id", user.id)
          .maybeSingle(),
        taskId
          ? service
              .from("plan_tasks")
              .select("title")
              .eq("id", taskId)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      const profile = profileData as {
        first_name: string | null;
        last_name: string | null;
        email: string | null;
      } | null;
      const task = taskData as { title: string | null } | null;
      const firstName = profile?.first_name ?? "";
      const lastName = profile?.last_name ?? "";
      const fullName = `${firstName} ${lastName}`.trim() || user.email || "Student";
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: process.env.RESEND_NOTIFICATION_EMAIL!,
        subject: `New document submission from ${fullName}`,
        html: `
          <p>A new document submission was received.</p>
          <p><strong>Student:</strong> ${fullName} (${profile?.email ?? user.email ?? "unknown"})</p>
          <p><strong>Task:</strong> ${task?.title ?? sectionLabel ?? "General"}</p>
          <p><strong>Files:</strong> ${files.length}</p>
          <p><a href="${siteUrl}/admin/users">Open admin panel</a></p>
        `,
      });
    } catch (emailError) {
      console.error("[documents] Admin notification failed:", emailError);
    }

    revalidatePath("/dashboard/my-documents");
    return { success: true, submissionId };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

function stringOrNull(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function fetchUserSubmissions(
  userId?: string
): Promise<DocumentSubmission[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !userId) return [];

  const client = userId ? createServiceClient() : supabase;
  const effectiveUserId = userId ?? user!.id;
  const { data } = await client
    .from("document_submissions")
    .select("*, document_submission_files(*)")
    .eq("user_id", effectiveUserId)
    .order("created_at", { ascending: false });

  return ((data ?? []) as DocumentSubmissionRow[]).map(normalizeSubmission);
}

export async function fetchSubmissionFiles(
  submissionId: string
): Promise<DocumentSubmissionFile[]> {
  const service = createServiceClient();
  const { data } = await service
    .from("document_submission_files")
    .select("*")
    .eq("submission_id", submissionId)
    .order("created_at", { ascending: true });

  const files = (data ?? []) as DocumentSubmissionFile[];
  return Promise.all(
    files.map(async (file) => ({
      ...file,
      signedUrl: await getSubmissionDownloadUrl(file.file_path),
    }))
  );
}

export async function getSubmissionDownloadUrl(
  filePath: string
): Promise<string | null> {
  const service = createServiceClient();
  const { data, error } = await service.storage
    .from("submissions")
    .createSignedUrl(filePath, 3600);

  if (error) return null;
  return data.signedUrl;
}
