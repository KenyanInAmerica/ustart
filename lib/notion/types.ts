import type { BlockObjectResponse } from "@notionhq/client/build/src/api-endpoints";

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[''`]/g, "")        // strip apostrophes before general replace
    .replace(/[^a-z0-9]+/g, "-") // remaining non-alphanumeric → hyphen
    .replace(/^-|-$/g, "");       // trim leading/trailing hyphens
}

export interface NotionChildPage {
  id: string;
  title: string;
  slug: string;
  notionUrl: string;
}

export interface NotionPageContent {
  id: string;
  title: string;
  notionUrl: string;
  blocks: BlockObjectResponse[];
}
