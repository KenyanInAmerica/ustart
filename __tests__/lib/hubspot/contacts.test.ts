/** @jest-environment node */

const mockHubspotFetch = jest.fn();

jest.mock("../../../lib/hubspot/client", () => ({
  hubspotFetch: (...args: unknown[]) => mockHubspotFetch(...args),
  getHubSpotEnvironment: jest.fn(() => "staging"),
}));

import {
  upsertHubSpotContact,
  trackHubSpotContact,
  toHubSpotDate,
  getHubSpotSearchUrl,
  getHubSpotContactDirectUrl,
  createHubSpotNote,
  trackHubSpotNote,
} from "../../../lib/hubspot/contacts";

// Helper — builds a minimal mock Response.
function makeRes(ok: boolean, status: number, data: unknown = null): Response {
  return {
    ok,
    status,
    statusText: ok ? "OK" : `Error ${status}`,
    text: jest.fn().mockResolvedValue(
      data === null ? "" : typeof data === "string" ? data : JSON.stringify(data)
    ),
    json: jest.fn().mockResolvedValue(data),
  } as unknown as Response;
}

// Flush pending microtasks so fire-and-forget calls can complete.
const flush = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
  mockHubspotFetch.mockReset();
});

// ── upsertHubSpotContact ──────────────────────────────────────────────────────

describe("upsertHubSpotContact", () => {
  it("calls hubspotFetch with the batch upsert endpoint", async () => {
    mockHubspotFetch.mockResolvedValueOnce(makeRes(true, 200));

    await upsertHubSpotContact({
      email: "alice@example.com",
      ustart_environment: "staging",
    });

    const [path, options] = mockHubspotFetch.mock.calls[0] as [string, RequestInit];
    expect(path).toBe("/crm/v3/objects/contacts/batch/upsert");
    expect(options.method).toBe("POST");

    const body = JSON.parse(options.body as string) as {
      inputs: { id: string; idProperty: string; properties: Record<string, string> }[];
    };
    expect(body.inputs[0].id).toBe("alice@example.com");
    expect(body.inputs[0].idProperty).toBe("email");
  });

  it("serializes boolean properties to 'true'/'false' strings", async () => {
    mockHubspotFetch.mockResolvedValueOnce(makeRes(true, 200));

    await upsertHubSpotContact({
      email: "bob@example.com",
      ustart_environment: "staging",
      ustart_intake_completed: true,
      ustart_parent_pack: false,
    });

    const [, options] = mockHubspotFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(options.body as string) as {
      inputs: { properties: Record<string, string> }[];
    };
    expect(body.inputs[0].properties.ustart_intake_completed).toBe("true");
    expect(body.inputs[0].properties.ustart_parent_pack).toBe("false");
  });

  it("serializes number properties to strings", async () => {
    mockHubspotFetch.mockResolvedValueOnce(makeRes(true, 200));

    await upsertHubSpotContact({
      email: "carol@example.com",
      ustart_environment: "staging",
      ustart_plan_progress: 75,
    });

    const [, options] = mockHubspotFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(options.body as string) as {
      inputs: { properties: Record<string, string> }[];
    };
    expect(body.inputs[0].properties.ustart_plan_progress).toBe("75");
  });

  it("strips undefined and null properties from the payload", async () => {
    mockHubspotFetch.mockResolvedValueOnce(makeRes(true, 200));

    await upsertHubSpotContact({
      email: "dave@example.com",
      ustart_environment: "staging",
      ustart_city: undefined,
      ustart_school: undefined,
    });

    const [, options] = mockHubspotFetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(options.body as string) as {
      inputs: { properties: Record<string, string> }[];
    };
    expect(body.inputs[0].properties).not.toHaveProperty("ustart_city");
    expect(body.inputs[0].properties).not.toHaveProperty("ustart_school");
  });

  it("logs an error on a non-ok response without throwing", async () => {
    mockHubspotFetch.mockResolvedValueOnce(makeRes(false, 400, "Bad request"));
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      upsertHubSpotContact({ email: "e@e.com", ustart_environment: "staging" })
    ).resolves.toBeUndefined();

    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("upsertContact failed"),
      expect.anything()
    );
    errorSpy.mockRestore();
  });

  it("catches a network error and logs without throwing", async () => {
    mockHubspotFetch.mockRejectedValueOnce(new Error("Network failure"));
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      upsertHubSpotContact({ email: "e@e.com", ustart_environment: "staging" })
    ).resolves.toBeUndefined();

    expect(errorSpy).toHaveBeenCalledWith(
      "[HubSpot] upsertContact failed:",
      expect.any(Error)
    );
    errorSpy.mockRestore();
  });
});

// ── trackHubSpotContact ────────────────────────────────────────────────────────

describe("trackHubSpotContact", () => {
  it("fires the upsert without throwing and reaches HubSpot fetch", async () => {
    mockHubspotFetch.mockResolvedValueOnce(makeRes(true, 200));

    expect(() =>
      trackHubSpotContact({ email: "t@t.com", ustart_environment: "staging" })
    ).not.toThrow();

    await flush();
    expect(mockHubspotFetch).toHaveBeenCalledTimes(1);
  });
});

// ── toHubSpotDate ─────────────────────────────────────────────────────────────

describe("toHubSpotDate", () => {
  it("returns undefined for null", () => {
    expect(toHubSpotDate(null)).toBeUndefined();
  });

  it("returns undefined for undefined", () => {
    expect(toHubSpotDate(undefined)).toBeUndefined();
  });

  it("returns undefined for an empty string", () => {
    expect(toHubSpotDate("")).toBeUndefined();
  });

  it("converts a Date object to YYYY-MM-DD", () => {
    expect(toHubSpotDate(new Date("2026-05-17T10:30:00.000Z"))).toBe(
      "2026-05-17"
    );
  });

  it("converts a date string to YYYY-MM-DD", () => {
    expect(toHubSpotDate("2026-01-31")).toBe("2026-01-31");
  });

  it("converts a datetime string by truncating to the date part", () => {
    expect(toHubSpotDate("2026-03-15T00:00:00.000Z")).toBe("2026-03-15");
  });
});

// ── getHubSpotSearchUrl ───────────────────────────────────────────────────────

describe("getHubSpotSearchUrl", () => {
  const originalPortal = process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID;

  afterEach(() => {
    if (originalPortal === undefined) {
      delete process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID;
    } else {
      process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID = originalPortal;
    }
  });

  it("returns the global search URL when portal ID is not set", () => {
    delete process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID;
    expect(getHubSpotSearchUrl("alice@example.com")).toBe(
      "https://app.hubspot.com/contacts/search/?query=alice%40example.com"
    );
  });

  it("returns a portal-scoped contacts list URL when portal ID is set", () => {
    process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID = "99999";
    expect(getHubSpotSearchUrl("alice@example.com")).toBe(
      "https://app.hubspot.com/contacts/99999/contacts/list/view/all/?query=alice%40example.com"
    );
  });

  it("URL-encodes special characters in the email", () => {
    delete process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID;
    const url = getHubSpotSearchUrl("user+tag@example.co.uk");
    expect(url).toContain(encodeURIComponent("user+tag@example.co.uk"));
  });
});

// ── getHubSpotContactDirectUrl ────────────────────────────────────────────────

describe("getHubSpotContactDirectUrl", () => {
  const originalPortal = process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID;

  afterEach(() => {
    if (originalPortal === undefined) {
      delete process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID;
    } else {
      process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID = originalPortal;
    }
  });

  it("returns a direct contact URL when contact found and portal ID is set", async () => {
    process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID = "12345";
    mockHubspotFetch.mockResolvedValueOnce(
      makeRes(true, 200, { results: [{ id: "contact-42" }] })
    );
    const url = await getHubSpotContactDirectUrl("user@test.com");
    expect(url).toBe(
      "https://app.hubspot.com/contacts/12345/contact/contact-42"
    );
  });

  it("returns null when the contact is not found", async () => {
    process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID = "12345";
    mockHubspotFetch.mockResolvedValueOnce(
      makeRes(true, 200, { results: [] })
    );
    expect(await getHubSpotContactDirectUrl("unknown@test.com")).toBeNull();
  });

  it("returns null when portal ID is not set", async () => {
    delete process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID;
    mockHubspotFetch.mockResolvedValueOnce(
      makeRes(true, 200, { results: [{ id: "contact-42" }] })
    );
    expect(await getHubSpotContactDirectUrl("user@test.com")).toBeNull();
  });

  it("returns null when the search request fails", async () => {
    process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID = "12345";
    mockHubspotFetch.mockResolvedValueOnce(makeRes(false, 400));
    expect(await getHubSpotContactDirectUrl("user@test.com")).toBeNull();
  });

  it("returns null on network error", async () => {
    process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID = "12345";
    mockHubspotFetch.mockRejectedValueOnce(new Error("timeout"));
    expect(await getHubSpotContactDirectUrl("user@test.com")).toBeNull();
  });
});

// ── createHubSpotNote ─────────────────────────────────────────────────────────

describe("createHubSpotNote", () => {
  it("searches, creates a note, and associates it with the contact on success", async () => {
    mockHubspotFetch
      .mockResolvedValueOnce(
        makeRes(true, 200, { results: [{ id: "contact-99" }] })
      )
      .mockResolvedValueOnce(makeRes(true, 200, { id: "note-42" }))
      .mockResolvedValueOnce(makeRes(true, 200));

    await createHubSpotNote("user@example.com", "Plan complete.");

    expect(mockHubspotFetch).toHaveBeenCalledTimes(3);

    const [searchPath, searchOpts] = mockHubspotFetch.mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(searchPath).toBe("/crm/v3/objects/contacts/search");
    expect(searchOpts.method).toBe("POST");

    const [notePath, noteOpts] = mockHubspotFetch.mock.calls[1] as [
      string,
      RequestInit,
    ];
    expect(notePath).toBe("/crm/v3/objects/notes");
    expect(noteOpts.method).toBe("POST");

    const [assocPath, assocOpts] = mockHubspotFetch.mock.calls[2] as [
      string,
      RequestInit,
    ];
    expect(assocPath).toContain("note-42");
    expect(assocPath).toContain("contact-99");
    expect(assocOpts.method).toBe("PUT");
  });

  it("returns early without creating a note when the contact is not found", async () => {
    mockHubspotFetch.mockResolvedValueOnce(
      makeRes(true, 200, { results: [] })
    );

    await createHubSpotNote("unknown@example.com", "A note.");

    expect(mockHubspotFetch).toHaveBeenCalledTimes(1);
  });

  it("logs an error and returns early when the search request fails", async () => {
    mockHubspotFetch.mockResolvedValueOnce(makeRes(false, 400, "Bad filter"));
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    await createHubSpotNote("user@example.com", "A note.");

    expect(mockHubspotFetch).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("createNote search failed"),
      expect.anything()
    );
    errorSpy.mockRestore();
  });

  it("logs an error and returns early when note creation fails", async () => {
    mockHubspotFetch
      .mockResolvedValueOnce(
        makeRes(true, 200, { results: [{ id: "contact-1" }] })
      )
      .mockResolvedValueOnce(makeRes(false, 500, "Server error"));
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    await createHubSpotNote("user@example.com", "A note.");

    expect(mockHubspotFetch).toHaveBeenCalledTimes(2);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("note creation failed"),
      expect.anything()
    );
    errorSpy.mockRestore();
  });

  it("logs an error when the association request fails but does not throw", async () => {
    mockHubspotFetch
      .mockResolvedValueOnce(
        makeRes(true, 200, { results: [{ id: "contact-1" }] })
      )
      .mockResolvedValueOnce(makeRes(true, 200, { id: "note-1" }))
      .mockResolvedValueOnce(makeRes(false, 422, "Unprocessable"));
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      createHubSpotNote("user@example.com", "A note.")
    ).resolves.toBeUndefined();

    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("association failed"),
      expect.anything()
    );
    errorSpy.mockRestore();
  });

  it("catches a thrown error and logs without throwing", async () => {
    mockHubspotFetch.mockRejectedValueOnce(new Error("timeout"));
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      createHubSpotNote("user@example.com", "A note.")
    ).resolves.toBeUndefined();

    expect(errorSpy).toHaveBeenCalledWith(
      "[HubSpot] createNote failed:",
      expect.any(Error)
    );
    errorSpy.mockRestore();
  });
});

// ── trackHubSpotNote ──────────────────────────────────────────────────────────

describe("trackHubSpotNote", () => {
  it("fires note creation without throwing and reaches HubSpot fetch", async () => {
    mockHubspotFetch
      .mockResolvedValueOnce(
        makeRes(true, 200, { results: [{ id: "contact-1" }] })
      )
      .mockResolvedValueOnce(makeRes(true, 200, { id: "note-1" }))
      .mockResolvedValueOnce(makeRes(true, 200));

    expect(() =>
      trackHubSpotNote("user@example.com", "Plan complete.")
    ).not.toThrow();

    await flush();
    expect(mockHubspotFetch).toHaveBeenCalledTimes(3);
  });
});
