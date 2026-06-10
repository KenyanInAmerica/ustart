import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { FooterViewConfig } from "@/components/ui/FooterView";

export const fetchFooterConfig = cache(async (): Promise<FooterViewConfig> => {
  const supabase = createClient();
  const { data } = await supabase
    .from("config")
    .select("key, value")
    .in("key", [
      "instagram_url",
      "tiktok_url",
      "affiliate_disclosure_enabled",
    ]);

  const rows = (data ?? []) as { key: string; value: string }[];
  const config = new Map(rows.map((row) => [row.key, row.value]));

  return {
    instagramUrl: config.get("instagram_url")?.trim() ?? "",
    tiktokUrl: config.get("tiktok_url")?.trim() ?? "",
    affiliateDisclosureEnabled:
      config.get("affiliate_disclosure_enabled") === "true",
  };
});
