// Server actions for the admin content library.
// Covers: uploading PDFs to Supabase Storage, inserting content_items rows,
// deleting PDFs (from both Storage and the table), and generating preview URLs.

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { logAction } from "@/lib/audit/log";
import { AuditAction } from "@/lib/audit/actions";
import type { ContentItem } from "@/types/admin";

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

// Uploads a PDF to Storage and inserts a content_items row.
// Expects FormData with fields: title, description, tier, file (File object).
// Storage path: pdfs/{tier}/{filename}
export async function uploadContentItem(
  formData: FormData
): Promise<ActionResult> {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return { success: false, error: auth.error };

    const title = (formData.get("title") as string | null)?.trim();
    const description = (formData.get("description") as string | null)?.trim();
    const tier = formData.get("tier") as string | null;
    const file = formData.get("file") as File | null;

    if (!title || !description || !tier || !file) {
      return { success: false, error: "All fields are required." };
    }

    const validTiers: ContentItem["tier"][] = ["lite", "pro", "premium", "parent_pack", "explore", "concierge"];
    if (!validTiers.includes(tier as ContentItem["tier"])) {
      return { success: false, error: "Invalid tier." };
    }

    if (file.type !== "application/pdf") {
      return { success: false, error: "Only PDF files are supported." };
    }

    const service = createServiceClient();

    // Sanitise the file name: lowercase, replace spaces/special chars with hyphens.
    const safeFileName = file.name
      .toLowerCase()
      .replace(/[^a-z0-9.\-_]/g, "-")
      .replace(/-+/g, "-");

    const filePath = `pdfs/${tier}/${safeFileName}`;

    // Upload to the private pdfs bucket.
    const { error: storageError } = await service.storage
      .from("pdfs")
      .upload(filePath, file, { contentType: "application/pdf", upsert: false });

    if (storageError) {
      return { success: false, error: `Upload failed: ${storageError.message}` };
    }

    // Insert the content_items row.
    const { error: dbError } = await service.from("content_items").insert({
      title,
      description,
      tier,
      file_path: filePath,
      file_name: safeFileName,
      uploaded_by: auth.adminId,
    });

    if (dbError) {
      // Roll back the Storage upload to avoid orphaned files.
      await service.storage.from("pdfs").remove([filePath]);
      return { success: false, error: dbError.message };
    }

    void logAction({
      actorId: auth.adminId,
      actorEmail: auth.adminEmail,
      action: AuditAction.ADMIN_CONTENT_UPLOADED,
      payload: { title, tier, fileName: safeFileName },
    });

    revalidatePath("/admin/content");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// Deletes a content item from both the content_items table and Supabase Storage.
export async function deleteContentItem(
  contentItemId: string
): Promise<ActionResult> {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return { success: false, error: auth.error };

    const service = createServiceClient();

    // Fetch metadata before deleting the row — used for Storage removal and audit log.
    const { data: item } = await service
      .from("content_items")
      .select("file_path, title, tier")
      .eq("id", contentItemId)
      .maybeSingle();

    const row = item as { file_path: string; title: string; tier: string } | null;
    if (!row) return { success: false, error: "Content item not found." };

    // Delete the DB row first so even if Storage removal fails, it won't be
    // accessible through the app.
    const { error: dbError } = await service
      .from("content_items")
      .delete()
      .eq("id", contentItemId);

    if (dbError) return { success: false, error: dbError.message };

    // Best-effort Storage deletion — log but don't fail the action.
    await service.storage.from("pdfs").remove([row.file_path]);

    void logAction({
      actorId: auth.adminId,
      actorEmail: auth.adminEmail,
      action: AuditAction.ADMIN_CONTENT_DELETED,
      targetId: contentItemId,
      payload: { title: row.title, tier: row.tier },
    });

    revalidatePath("/admin/content");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// Uploads a PDF and immediately assigns it to a specific user.
// Sets is_individual_only = true so the file never appears in tier-based
// content feeds — it is only reachable through this user's assignment.
// Creates a content_items row then a user_content_items row in sequence.
// Rolls back both Storage and content_items if the assignment insert fails.
export async function uploadAndAssignContentItem(
  formData: FormData,
  userId: string
): Promise<ActionResult> {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return { success: false, error: auth.error };

    const title = (formData.get("title") as string | null)?.trim();
    const file = formData.get("file") as File | null;

    if (!title || !file) {
      return { success: false, error: "Title and file are required." };
    }

    if (file.type !== "application/pdf") {
      return { success: false, error: "Only PDF files are supported." };
    }

    const service = createServiceClient();

    const safeFileName = file.name
      .toLowerCase()
      .replace(/[^a-z0-9.\-_]/g, "-")
      .replace(/-+/g, "-");

    // Scope under the target user's ID to prevent filename collisions between users
    // and to make per-user cleanup straightforward.
    const filePath = `pdfs/individual/${userId}/${safeFileName}`;

    const { error: storageError } = await service.storage
      .from("pdfs")
      .upload(filePath, file, { contentType: "application/pdf", upsert: false });

    if (storageError) {
      return { success: false, error: `Upload failed: ${storageError.message}` };
    }

    // Insert the content_items row and retrieve the new ID for the assignment.
    // tier defaults to "lite" to satisfy the NOT NULL constraint — it has no
    // effect because is_individual_only = true excludes this row from all tier queries.
    const { data: insertedItem, error: dbError } = await service
      .from("content_items")
      .insert({
        title,
        tier: "lite",
        file_path: filePath,
        file_name: safeFileName,
        uploaded_by: auth.adminId,
        is_individual_only: true,
      })
      .select("id")
      .single();

    if (dbError || !insertedItem) {
      await service.storage.from("pdfs").remove([filePath]);
      return { success: false, error: dbError?.message ?? "Failed to save content item." };
    }

    const contentItemId = (insertedItem as { id: string }).id;

    // Assign the newly uploaded PDF to the target user.
    const { error: assignError } = await service.from("user_content_items").insert({
      user_id: userId,
      content_item_id: contentItemId,
      assigned_by: auth.adminId,
    });

    if (assignError) {
      // Roll back: delete DB row and Storage file so nothing is orphaned.
      await service.from("content_items").delete().eq("id", contentItemId);
      await service.storage.from("pdfs").remove([filePath]);
      return { success: false, error: assignError.message };
    }

    void logAction({
      actorId: auth.adminId,
      actorEmail: auth.adminEmail,
      action: AuditAction.ADMIN_CONTENT_ASSIGNED,
      targetId: userId,
      payload: { contentItemId, title },
    });

    revalidatePath("/admin/content");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// Generates a 60-minute signed URL for previewing a PDF in the browser.
export async function getContentPreviewUrl(
  filePath: string
): Promise<{ success: true; url: string } | { success: false; error: string }> {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return { success: false, error: auth.error };

    const service = createServiceClient();
    const { data, error } = await service.storage
      .from("pdfs")
      .createSignedUrl(filePath, 60 * 60); // 60 minutes

    if (error || !data?.signedUrl) {
      return { success: false, error: error?.message ?? "Could not generate preview URL." };
    }

    return { success: true, url: data.signedUrl };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
