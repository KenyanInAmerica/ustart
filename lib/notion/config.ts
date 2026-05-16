export const NOTION_PAGE_IDS = {
  lite: process.env.NOTION_LITE_PAGE_ID ?? "",
  explore: process.env.NOTION_EXPLORE_PAGE_ID ?? "",
  concierge: process.env.NOTION_CONCIERGE_PAGE_ID ?? "",
  parentPack: process.env.NOTION_PARENT_PACK_PAGE_ID ?? "",
  parentHub: process.env.NOTION_PARENT_HUB_PAGE_ID ?? "",
} as const;

export type NotionTier = keyof typeof NOTION_PAGE_IDS;
