import { cache } from "react";
import type {
  BlockObjectResponse,
  PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";
import { getNotionClient } from "./client";
import { slugify, type NotionChildPage } from "./types";

export const getNotionPage = cache(
  async (pageId: string): Promise<PageObjectResponse | null> => {
    try {
      const notion = getNotionClient();
      const page = await notion.pages.retrieve({ page_id: pageId });
      // PartialPageObjectResponse lacks 'properties' — only accept full pages
      if ("properties" in page) {
        return page as PageObjectResponse;
      }
      return null;
    } catch {
      return null;
    }
  }
);

export const getNotionBlocks = cache(
  async (pageId: string): Promise<BlockObjectResponse[]> => {
    try {
      const notion = getNotionClient();
      const blocks: BlockObjectResponse[] = [];
      let cursor: string | undefined = undefined;

      do {
        const response = await notion.blocks.children.list({
          block_id: pageId,
          start_cursor: cursor,
          page_size: 100,
        });
        blocks.push(...(response.results as BlockObjectResponse[]));
        cursor = response.next_cursor ?? undefined;
      } while (cursor);

      return blocks;
    } catch {
      return [];
    }
  }
);

export const getNotionChildPages = cache(
  async (pageId: string): Promise<NotionChildPage[]> => {
    try {
      const blocks = await getNotionBlocks(pageId);
      return blocks
        .filter(
          (block): block is Extract<BlockObjectResponse, { type: "child_page" }> =>
            block.type === "child_page"
        )
        .map((block) => {
          const title = block.child_page.title;
          return {
            id: block.id,
            title,
            slug: slugify(title),
            notionUrl: `https://notion.so/${block.id.replace(/-/g, "")}`,
          };
        });
    } catch {
      return [];
    }
  }
);

// Fetches children for every toggle block in the list, in parallel.
// Not cached — result depends on the full block array, not a stable key.
export async function fetchToggleChildren(
  blocks: BlockObjectResponse[]
): Promise<Map<string, BlockObjectResponse[]>> {
  const toggleMap = new Map<string, BlockObjectResponse[]>();
  const toggleBlocks = blocks.filter((b) => b.type === "toggle");

  await Promise.all(
    toggleBlocks.map(async (block) => {
      const children = await getNotionBlocks(block.id);
      toggleMap.set(block.id, children);
    })
  );

  return toggleMap;
}

export const getNotionPageTitle = cache(
  async (pageId: string): Promise<string | null> => {
    try {
      const page = await getNotionPage(pageId);
      if (!page) return null;

      // Notion title properties can live under 'title' or 'Name' depending on DB type
      const titleProp =
        page.properties["title"] ?? page.properties["Name"];
      if (
        titleProp &&
        "title" in titleProp &&
        Array.isArray(titleProp.title) &&
        titleProp.title.length > 0
      ) {
        return titleProp.title[0].plain_text;
      }
      return null;
    } catch {
      return null;
    }
  }
);
