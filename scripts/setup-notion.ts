/**
 * One-time Notion setup script.
 *
 * Creates the full UStart page structure under a specified root page and
 * prints all generated page IDs in .env.local format so they can be pasted
 * directly into the file.
 *
 * Usage:
 *   NOTION_ROOT_PAGE_ID=<id> npm run notion:setup
 *
 * Or set NOTION_ROOT_PAGE_ID in .env.local and run:
 *   npm run notion:setup
 */

import * as dotenv from "dotenv";
import * as path from "path";
import { Client } from "@notionhq/client";

// Load .env.local (Next.js convention — dotenv defaults to .env)
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const PLACEHOLDER =
  "This page is coming soon. Content will be added by the UStart team.";

const LITE_MODULES = [
  "Welcome to UStart Lite",
  "Don't Land Without This",
  "Set This Up Before You Fly",
  "Do This Within 2 Hours of Landing",
  "How To Structure Your First Week",
  "What Actually Matters vs What Doesn't",
  "Common Mistakes",
  "First Week: How To Stop Feeling Lost",
  "Setup Guides",
];

function notionUrl(pageId: string): string {
  return `https://notion.so/${pageId.replace(/-/g, "")}`;
}

// Notion page IDs are 32 hex chars. Users often paste the full URL slug
// (e.g. "UStart-fe72aae6e00a48dbbbfdee7a0582a17a") or even a full URL.
// This extracts just the bare UUID portion from whatever format is given.
function extractPageId(raw: string): string {
  // Strip a full URL down to the path segment
  const stripped = raw.replace(/^https?:\/\/[^/]+\//, "").trim();
  // The ID is the trailing 32 hex chars (optionally preceded by a title slug and dash)
  const match = stripped.match(/([0-9a-f]{32})$/i);
  if (match) return match[1];
  // Already a clean hyphenated UUID (8-4-4-4-12)?
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(stripped)) {
    return stripped;
  }
  // Return as-is and let the API surface a clear error
  return stripped;
}

async function createPage(
  notion: Client,
  parentPageId: string,
  title: string,
  content: string = PLACEHOLDER
): Promise<string | null> {
  try {
    const response = await notion.pages.create({
      parent: { page_id: parentPageId },
      properties: {
        title: {
          title: [{ text: { content: title } }],
        },
      },
      children: [
        {
          object: "block",
          type: "paragraph",
          paragraph: {
            rich_text: [{ text: { content } }],
          },
        },
      ],
    });
    return response.id;
  } catch (err) {
    console.error(`  ✗ Failed to create "${title}":`, err);
    return null;
  }
}

async function main() {
  const apiKey = process.env.NOTION_API_KEY;
  if (!apiKey) {
    console.error(
      "\nError: NOTION_API_KEY is not set.\n" +
        "Add it to .env.local or export it before running this script.\n"
    );
    process.exit(1);
  }

  const rawRootId =
    process.env.NOTION_ROOT_PAGE_ID ?? process.argv[2] ?? "";
  if (!rawRootId) {
    console.error(
      "\nError: NOTION_ROOT_PAGE_ID is not set.\n" +
        "Set it in .env.local or pass it as the first argument:\n" +
        "  NOTION_ROOT_PAGE_ID=<page_id> npm run notion:setup\n" +
        "\nThe root page ID is the 32-char hex string in the Notion URL:\n" +
        "  https://notion.so/Your-Page-Title-<page_id_here>\n" +
        "You can also paste the full URL or full slug — the script will extract the ID.\n"
    );
    process.exit(1);
  }

  const rootPageId = extractPageId(rawRootId);
  const notion = new Client({ auth: apiKey });

  console.log("\nCreating UStart page structure in Notion...\n");
  console.log(`Root page ID: ${rootPageId}`);

  // --- Top-level tier pages ---
  console.log('\nCreating top-level pages under root...');

  const liteId = await createPage(notion, rootPageId, "UStart Lite");
  const exploreId = await createPage(notion, rootPageId, "UStart Explore");
  const conciergeId = await createPage(notion, rootPageId, "UStart Concierge");
  const parentPackId = await createPage(notion, rootPageId, "Parent Pack");
  const parentHubId = await createPage(notion, rootPageId, "Parent Hub");

  // --- Lite modules ---
  const moduleResults: Array<{ title: string; id: string | null }> = [];

  if (liteId) {
    console.log('\nCreating Lite modules under "UStart Lite"...');
    for (const title of LITE_MODULES) {
      const id = await createPage(notion, liteId, title);
      moduleResults.push({ title, id });
      if (id) {
        console.log(`  ✓ ${title}`);
      }
    }
  } else {
    console.error(
      "\nSkipping Lite module creation — UStart Lite page was not created."
    );
  }

  // --- Output ---
  console.log("\n===========================================");
  console.log("NOTION SETUP COMPLETE");
  console.log("===========================================");
  console.log("\nAdd these to your .env.local:\n");

  console.log(`NOTION_LITE_PAGE_ID=${liteId ?? "<creation failed>"}`);
  console.log(`NOTION_EXPLORE_PAGE_ID=${exploreId ?? "<creation failed>"}`);
  console.log(`NOTION_CONCIERGE_PAGE_ID=${conciergeId ?? "<creation failed>"}`);
  console.log(`NOTION_PARENT_PACK_PAGE_ID=${parentPackId ?? "<creation failed>"}`);
  console.log(`NOTION_PARENT_HUB_PAGE_ID=${parentHubId ?? "<creation failed>"}`);

  if (moduleResults.length > 0) {
    console.log("\nUStart Lite modules created:");
    for (const { title, id } of moduleResults) {
      if (id) {
        console.log(`  ✓ ${title} (${id})`);
      } else {
        console.log(`  ✗ ${title} (failed)`);
      }
    }
  }

  console.log("\n===========================================\n");

  if (liteId) {
    console.log("Notion URLs for reference:");
    console.log(`  UStart Lite:      ${notionUrl(liteId)}`);
  }
  if (exploreId) {
    console.log(`  UStart Explore:   ${notionUrl(exploreId)}`);
  }
  if (conciergeId) {
    console.log(`  UStart Concierge: ${notionUrl(conciergeId)}`);
  }
  if (parentPackId) {
    console.log(`  Parent Pack:      ${notionUrl(parentPackId)}`);
  }
  if (parentHubId) {
    console.log(`  Parent Hub:       ${notionUrl(parentHubId)}`);
  }
  console.log("");
}

main();
