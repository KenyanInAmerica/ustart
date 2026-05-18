/**
 * One-time HubSpot setup script.
 *
 * Creates the "UStart" custom property group and all 12 custom contact
 * properties in your HubSpot account. Safe to re-run — 409 conflicts
 * (already-exists) are logged and skipped, not treated as errors.
 *
 * Usage:
 *   npm run hubspot:setup
 *
 * Requires HUBSPOT_API_KEY to be set in .env.local before running.
 */

import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const HUBSPOT_API_BASE = "https://api.hubapi.com";

interface BooleanOption {
  label: string;
  value: string;
  displayOrder: number;
  hidden: boolean;
}

interface PropertyDefinition {
  name: string;
  label: string;
  type: string;
  fieldType: string;
}

const BOOL_OPTIONS: BooleanOption[] = [
  { label: "Yes", value: "true", displayOrder: 0, hidden: false },
  { label: "No", value: "false", displayOrder: 1, hidden: false },
];

const PROPERTIES: PropertyDefinition[] = [
  { name: "ustart_environment", label: "UStart Environment", type: "string", fieldType: "text" },
  { name: "ustart_role", label: "UStart Role", type: "string", fieldType: "text" },
  { name: "ustart_tier", label: "UStart Tier", type: "string", fieldType: "text" },
  { name: "ustart_signup_date", label: "UStart Signup Date", type: "date", fieldType: "date" },
  { name: "ustart_intake_completed", label: "UStart Intake Completed", type: "bool", fieldType: "booleancheckbox" },
  { name: "ustart_arrival_date", label: "UStart Arrival Date", type: "date", fieldType: "date" },
  { name: "ustart_city", label: "UStart City", type: "string", fieldType: "text" },
  { name: "ustart_school", label: "UStart School", type: "string", fieldType: "text" },
  { name: "ustart_main_concerns", label: "UStart Main Concerns", type: "string", fieldType: "text" },
  { name: "ustart_parent_pack", label: "UStart Parent Pack", type: "bool", fieldType: "booleancheckbox" },
  { name: "ustart_graduation_timeline", label: "UStart Graduation Timeline", type: "string", fieldType: "text" },
  { name: "ustart_plan_progress", label: "UStart Plan Progress", type: "number", fieldType: "number" },
];

function hubspotHeaders(apiKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

async function createPropertyGroup(apiKey: string): Promise<boolean> {
  try {
    const res = await fetch(
      `${HUBSPOT_API_BASE}/crm/v3/properties/contacts/groups`,
      {
        method: "POST",
        headers: hubspotHeaders(apiKey),
        body: JSON.stringify({ name: "ustart", label: "UStart" }),
      }
    );

    if (res.status === 409) {
      console.log("  ℹ ustart (UStart) — already exists");
      return true;
    }

    if (!res.ok) {
      const body = await res.text();
      console.error(`  ✗ Failed to create property group: ${res.status}`, body);
      return false;
    }

    console.log("  ✓ ustart (UStart)");
    return true;
  } catch (err) {
    console.error("  ✗ Failed to create property group:", err);
    return false;
  }
}

async function createProperty(
  apiKey: string,
  prop: PropertyDefinition
): Promise<boolean> {
  try {
    const res = await fetch(
      `${HUBSPOT_API_BASE}/crm/v3/properties/contacts`,
      {
        method: "POST",
        headers: hubspotHeaders(apiKey),
        body: JSON.stringify({
          name: prop.name,
          label: prop.label,
          type: prop.type,
          fieldType: prop.fieldType,
          groupName: "ustart",
          ...(prop.type === "bool" ? { options: BOOL_OPTIONS } : {}),
        }),
      }
    );

    if (res.status === 409) {
      console.log(`  ℹ ${prop.name} — already exists`);
      return true;
    }

    if (!res.ok) {
      const body = await res.text();
      console.error(`  ✗ ${prop.name}: ${res.status}`, body);
      return false;
    }

    console.log(`  ✓ ${prop.name}`);
    return true;
  } catch (err) {
    console.error(`  ✗ ${prop.name}:`, err);
    return false;
  }
}

async function main() {
  const apiKey = process.env.HUBSPOT_API_KEY;
  if (!apiKey) {
    console.error(
      "\nError: HUBSPOT_API_KEY is not set.\n" +
        "Add it to .env.local and run: npm run hubspot:setup\n"
    );
    process.exit(1);
  }

  console.log("\nCreating UStart HubSpot properties...\n");

  console.log("Property group:");
  const groupOk = await createPropertyGroup(apiKey);

  console.log("\nCustom properties:");
  const propertyResults: Record<string, boolean> = {};
  for (const prop of PROPERTIES) {
    propertyResults[prop.name] = await createProperty(apiKey, prop);
  }

  console.log("\n===========================================");
  console.log("HUBSPOT SETUP COMPLETE");
  console.log("===========================================");
  console.log("\nProperty group:");
  console.log(`  ${groupOk ? "✓" : "✗"} ustart (UStart)`);
  console.log("\nCustom properties created:");
  for (const prop of PROPERTIES) {
    console.log(`  ${propertyResults[prop.name] ? "✓" : "✗"} ${prop.name}`);
  }
  console.log("\nRun this against any HubSpot account by setting");
  console.log("HUBSPOT_API_KEY in .env.local before running.");
  console.log("===========================================\n");
}

main();
