// Server-side data-fetching for dashboard content pages.
// Uses the service client so we can query content_items without relying on RLS —
// entitlement enforcement lives in the API route and in the page-level guards.

import { cache } from "react";
import { createServiceClient } from "@/lib/supabase/service";
import type { ContentItem } from "@/types/admin";
import type { ContentGridItem } from "@/components/dashboard/ContentGrid";

// Fetches all non-individual content items for a given tier, ordered by upload
// date (oldest first so the curriculum flows naturally).
export const fetchTierContent = cache(
  async (tier: ContentItem["tier"]): Promise<ContentGridItem[]> => {
    const service = createServiceClient();
    const { data } = await service
      .from("content_items")
      .select("id, title, description")
      .eq("tier", tier)
      .eq("is_individual_only", false)
      .order("created_at", { ascending: true });

    return (data ?? []) as ContentGridItem[];
  }
);

// Fetches all content items individually assigned to a user via
// user_content_items, ordered by assignment date (newest first).
export const fetchUserDocuments = cache(
  async (
    userId: string
  ): Promise<(ContentGridItem & { assigned_at: string })[]> => {
    const service = createServiceClient();
    const { data } = await service
      .from("user_content_items")
      .select("created_at, content_items(id, title, description)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    // Supabase returns the joined table using the plural table name as the key.
    type RawRow = {
      created_at: string;
      content_items: { id: string; title: string; description: string } | null;
    };

    return ((data ?? []) as unknown as RawRow[])
      .filter((row) => row.content_items !== null)
      .map((row) => ({
        id: row.content_items!.id,
        title: row.content_items!.title,
        description: row.content_items!.description,
        assigned_at: row.created_at,
      }));
  }
);
