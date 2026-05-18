/**
 * Purge script — deletes all HubSpot contacts tagged ustart_environment=staging.
 *
 * Safe to run repeatedly. Requires explicit 'confirm' input before any deletion.
 *
 * Usage:
 *   npm run hubspot:purge-staging
 *
 * Requires HUBSPOT_API_KEY to be set in .env.local before running.
 */

import * as dotenv from "dotenv";
import * as path from "path";
import * as readline from "readline";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const HUBSPOT_API_BASE = "https://api.hubapi.com";
const BATCH_SIZE = 100;

function hubspotHeaders(apiKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

interface ContactResult {
  id: string;
  properties: { email: string; ustart_environment: string };
}

interface SearchResponse {
  results: ContactResult[];
  paging?: { next?: { after: string } };
}

async function fetchStagingContacts(apiKey: string): Promise<ContactResult[]> {
  const contacts: ContactResult[] = [];
  let after: string | undefined;

  do {
    try {
      const body: Record<string, unknown> = {
        filterGroups: [
          {
            filters: [
              {
                propertyName: "ustart_environment",
                operator: "EQ",
                value: "staging",
              },
            ],
          },
        ],
        properties: ["email", "ustart_environment"],
        limit: BATCH_SIZE,
      };

      if (after) body.after = after;

      const res = await fetch(
        `${HUBSPOT_API_BASE}/crm/v3/objects/contacts/search`,
        {
          method: "POST",
          headers: hubspotHeaders(apiKey),
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) {
        const text = await res.text();
        console.error(`  ✗ Search failed: ${res.status}`, text);
        break;
      }

      const data = (await res.json()) as SearchResponse;
      contacts.push(...data.results);
      after = data.paging?.next?.after;
    } catch (err) {
      console.error("  ✗ Search error:", err);
      break;
    }
  } while (after);

  return contacts;
}

async function deleteBatch(
  apiKey: string,
  ids: string[],
  batchIndex: number,
  totalBatches: number
): Promise<boolean> {
  console.log(
    `\nDeleting batch ${batchIndex} of ${totalBatches} (${ids.length} contacts)...`
  );

  try {
    const res = await fetch(
      `${HUBSPOT_API_BASE}/crm/v3/objects/contacts/batch/archive`,
      {
        method: "POST",
        headers: hubspotHeaders(apiKey),
        body: JSON.stringify({ inputs: ids.map((id) => ({ id })) }),
      }
    );

    // 204 No Content is the success response for batch archive.
    if (!res.ok && res.status !== 204) {
      const text = await res.text();
      console.error(`  ✗ Batch ${batchIndex} failed: ${res.status}`, text);
      return false;
    }

    console.log(`  ✓ Batch ${batchIndex} deleted`);
    return true;
  } catch (err) {
    console.error(`  ✗ Batch ${batchIndex} error:`, err);
    return false;
  }
}

async function countRemaining(apiKey: string): Promise<number> {
  try {
    const res = await fetch(
      `${HUBSPOT_API_BASE}/crm/v3/objects/contacts/search`,
      {
        method: "POST",
        headers: hubspotHeaders(apiKey),
        body: JSON.stringify({
          filterGroups: [
            {
              filters: [
                {
                  propertyName: "ustart_environment",
                  operator: "EQ",
                  value: "staging",
                },
              ],
            },
          ],
          properties: ["email"],
          limit: 1,
        }),
      }
    );

    if (!res.ok) return -1;

    const data = (await res.json()) as { total?: number };
    return data.total ?? -1;
  } catch {
    return -1;
  }
}

async function main() {
  const apiKey = process.env.HUBSPOT_API_KEY;
  if (!apiKey) {
    console.error(
      "\nError: HUBSPOT_API_KEY is not set.\n" +
        "Add it to .env.local and run: npm run hubspot:purge-staging\n"
    );
    process.exit(1);
  }

  console.log("\n===========================================");
  console.log("HUBSPOT STAGING PURGE");
  console.log("===========================================");

  console.log("\nSearching for contacts tagged ustart_environment=staging...");
  const contacts = await fetchStagingContacts(apiKey);

  console.log(
    `\nFound ${contacts.length} contacts tagged ustart_environment=staging.`
  );

  if (contacts.length === 0) {
    console.log("\nNothing to delete.");
    console.log("\n===========================================");
    console.log("PURGE COMPLETE");
    console.log("===========================================");
    console.log("Deleted: 0 contacts");
    console.log("Remaining staging contacts: 0");
    console.log("===========================================\n");
    return;
  }

  console.log(
    "\nThis will delete all HubSpot contacts tagged ustart_environment=staging."
  );
  const answer = await prompt("Type 'confirm' to proceed: ");

  if (answer !== "confirm") {
    console.log("\nAborted. No contacts deleted.\n");
    process.exit(0);
  }

  // Split into batches of BATCH_SIZE.
  const ids = contacts.map((c) => c.id);
  const batches: string[][] = [];
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    batches.push(ids.slice(i, i + BATCH_SIZE));
  }

  let deletedCount = 0;
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    const success = await deleteBatch(apiKey, batch, i + 1, batches.length);
    if (success) deletedCount += batch.length;
  }

  const remaining = await countRemaining(apiKey);

  console.log("\n===========================================");
  console.log("PURGE COMPLETE");
  console.log("===========================================");
  console.log(`Deleted: ${deletedCount} contacts`);
  console.log(
    `Remaining staging contacts: ${remaining >= 0 ? remaining : "unknown"}`
  );
  console.log("===========================================\n");
}

main();
