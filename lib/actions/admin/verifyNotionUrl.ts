"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getNotionClient } from "@/lib/notion/client";
import { isNotionUrl, extractNotionPageId } from "@/lib/notion/urlConverter";
import { slugify } from "@/lib/notion/types";

interface VerifyResult {
  valid: boolean;
  pageTitle: string | null;
  convertedUrl: string | null;
  error: string | null;
}

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

  const row = profile as { is_admin: boolean } | null;
  if (!row?.is_admin) return { ok: false, error: "Forbidden." };

  return { ok: true, adminId: user.id };
}

export async function verifyNotionUrl(
  notionUrl: string,
  tier: string
): Promise<VerifyResult> {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return { valid: false, pageTitle: null, convertedUrl: null, error: "Forbidden" };
  }

  if (!isNotionUrl(notionUrl)) {
    return {
      valid: false,
      pageTitle: null,
      convertedUrl: null,
      error: "Not a Notion URL",
    };
  }

  const pageId = extractNotionPageId(notionUrl);
  if (!pageId) {
    return {
      valid: false,
      pageTitle: null,
      convertedUrl: null,
      error: "Could not extract page ID from URL",
    };
  }

  try {
    const notion = getNotionClient();
    const page = await notion.pages.retrieve({ page_id: pageId });

    let pageTitle: string | null = null;

    if ("properties" in page) {
      const titleProp =
        page.properties["title"] ?? page.properties["Name"];
      if (
        titleProp &&
        "title" in titleProp &&
        Array.isArray(titleProp.title) &&
        titleProp.title.length > 0
      ) {
        pageTitle = titleProp.title[0].plain_text;
      }
    }

    const slug = pageTitle ? slugify(pageTitle) : pageId;
    const convertedUrl = `/dashboard/content/${tier}/${slug}`;

    return { valid: true, pageTitle, convertedUrl, error: null };
  } catch {
    return {
      valid: false,
      pageTitle: null,
      convertedUrl: null,
      error:
        "Page not found or not accessible. Make sure the page is shared with the UStart integration.",
    };
  }
}
