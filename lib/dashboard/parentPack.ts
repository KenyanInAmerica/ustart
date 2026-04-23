import { cache } from "react";
import { createServiceClient } from "@/lib/supabase/service";

export interface ParentPackLinks {
  parentPackNotionUrl: string;
  parentContentNotionUrl: string;
}

export const fetchParentPackLinks = cache(async (): Promise<ParentPackLinks> => {
  const service = createServiceClient();
  const { data } = await service
    .from("config")
    .select("key, value")
    .in("key", [
      "parent_pack_notion_url",
      "parent_content_notion_url",
    ]);

  const rows = (data ?? []) as { key: string; value: string }[];
  const config = new Map(rows.map((row) => [row.key, row.value]));

  return {
    parentPackNotionUrl: config.get("parent_pack_notion_url") ?? "",
    parentContentNotionUrl: config.get("parent_content_notion_url") ?? "",
  };
});
