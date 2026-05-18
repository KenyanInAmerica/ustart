import { hubspotFetch } from "./client";

export interface HubSpotContactProperties {
  email: string;
  firstname?: string;
  lastname?: string;
  phone?: string;
  country?: string;
  lifecyclestage?: string;
  hs_lead_status?: string;
  ustart_environment: string;
  ustart_role?: string;
  ustart_tier?: string;
  ustart_signup_date?: string; // ISO date YYYY-MM-DD
  ustart_intake_completed?: boolean;
  ustart_arrival_date?: string; // ISO date YYYY-MM-DD
  ustart_city?: string;
  ustart_school?: string;
  ustart_main_concerns?: string;
  ustart_parent_pack?: boolean;
  ustart_graduation_timeline?: string;
  ustart_plan_progress?: number;
}

export async function upsertHubSpotContact(
  properties: HubSpotContactProperties
): Promise<void> {
  try {
    // HubSpot requires all property values to be strings.
    // Booleans must be "true"/"false", numbers must be stringified.
    const serialized: Record<string, string> = {};
    for (const [k, v] of Object.entries(properties)) {
      if (v === undefined || v === null) continue;
      serialized[k] =
        typeof v === "boolean" || typeof v === "number" ? String(v) : v;
    }

    // batch/upsert creates the contact if it doesn't exist and updates if it does.
    // PATCH /crm/v3/objects/contacts/{email}?idProperty=email only updates existing
    // contacts and returns 404 for new ones, so it is not suitable for first-time signups.
    const res = await hubspotFetch("/crm/v3/objects/contacts/batch/upsert", {
      method: "POST",
      body: JSON.stringify({
        inputs: [
          {
            id: properties.email,
            idProperty: "email",
            properties: serialized,
          },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(
        `[HubSpot] upsertContact failed: ${res.status} ${res.statusText}`,
        body
      );
    }
  } catch (error) {
    console.error("[HubSpot] upsertContact failed:", error);
  }
}

// Fire-and-forget wrapper — same pattern as void logAction().
// The .catch() is a last-resort safety net; upsertHubSpotContact's own
// try/catch means this callback is unreachable under normal operation.
export function trackHubSpotContact(
  properties: HubSpotContactProperties
): void {
  void upsertHubSpotContact(properties).catch((err) =>
    console.error("[HubSpot] track failed:", err)
  );
}

export function toHubSpotDate(
  date: Date | string | null | undefined
): string | undefined {
  if (!date) return undefined;
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().split("T")[0]; // YYYY-MM-DD
}

export async function createHubSpotNote(
  email: string,
  note: string
): Promise<void> {
  try {
    // Step 1 — find the contact ID by email.
    const searchRes = await hubspotFetch("/crm/v3/objects/contacts/search", {
      method: "POST",
      body: JSON.stringify({
        filterGroups: [
          {
            filters: [
              { propertyName: "email", operator: "EQ", value: email },
            ],
          },
        ],
        properties: ["email"],
        limit: 1,
      }),
    });

    if (!searchRes.ok) {
      const body = await searchRes.text();
      console.error(
        `[HubSpot] createNote search failed: ${searchRes.status}`,
        body
      );
      return;
    }

    const searchData = (await searchRes.json()) as {
      results: { id: string }[];
    };
    const contactId = searchData.results[0]?.id;
    if (!contactId) return; // contact not yet in HubSpot — silently skip

    // Step 2 — create the note engagement.
    const noteRes = await hubspotFetch("/crm/v3/objects/notes", {
      method: "POST",
      body: JSON.stringify({
        properties: {
          hs_note_body: note,
          hs_timestamp: Date.now().toString(),
        },
      }),
    });

    if (!noteRes.ok) {
      const body = await noteRes.text();
      console.error(
        `[HubSpot] createNote note creation failed: ${noteRes.status}`,
        body
      );
      return;
    }

    const noteData = (await noteRes.json()) as { id: string };
    const noteId = noteData.id;

    // Step 3 — associate the note with the contact.
    const assocRes = await hubspotFetch(
      `/crm/v4/objects/notes/${noteId}/associations/contacts/${contactId}/note_to_contact`,
      { method: "PUT" }
    );

    if (!assocRes.ok) {
      const body = await assocRes.text();
      console.error(
        `[HubSpot] createNote association failed: ${assocRes.status}`,
        body
      );
    }
  } catch (error) {
    console.error("[HubSpot] createNote failed:", error);
  }
}

// Returns a filtered contact list URL. If NEXT_PUBLIC_HUBSPOT_PORTAL_ID is set,
// the URL scopes to the portal's contacts view; otherwise falls back to global search.
export function getHubSpotSearchUrl(email: string): string {
  const portalId = process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID;
  const encoded = encodeURIComponent(email);
  if (portalId) {
    return `https://app.hubspot.com/contacts/${portalId}/contacts/list/view/all/?query=${encoded}`;
  }
  return `https://app.hubspot.com/contacts/search/?query=${encoded}`;
}

// Looks up the contact in HubSpot by email and returns a direct link to the record.
// Requires NEXT_PUBLIC_HUBSPOT_PORTAL_ID. Returns null if contact not found,
// portal ID not set, or any error occurs.
export async function getHubSpotContactDirectUrl(
  email: string
): Promise<string | null> {
  try {
    const portalId = process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID;

    const searchRes = await hubspotFetch("/crm/v3/objects/contacts/search", {
      method: "POST",
      body: JSON.stringify({
        filterGroups: [
          {
            filters: [
              { propertyName: "email", operator: "EQ", value: email },
            ],
          },
        ],
        properties: ["email"],
        limit: 1,
      }),
    });

    if (!searchRes.ok) return null;

    const data = (await searchRes.json()) as { results: { id: string }[] };
    const contactId = data.results[0]?.id;
    if (!contactId || !portalId) return null;

    return `https://app.hubspot.com/contacts/${portalId}/contact/${contactId}`;
  } catch {
    return null;
  }
}

// The .catch() is a last-resort safety net; createHubSpotNote's own
// try/catch means this callback is unreachable under normal operation.
export function trackHubSpotNote(email: string, note: string): void {
  void createHubSpotNote(email, note).catch((err) =>
    console.error("[HubSpot] createNote failed:", err)
  );
}
