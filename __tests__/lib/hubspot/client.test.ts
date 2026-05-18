/** @jest-environment node */

import { getHubSpotApiKey, getHubSpotEnvironment, hubspotFetch } from "../../../lib/hubspot/client";

// Override global fetch before the suite runs.
const mockFetch = jest.fn();
(global as Record<string, unknown>).fetch = mockFetch;

// ── getHubSpotApiKey ───────────────────────────────────────────────────────────

describe("getHubSpotApiKey", () => {
  const original = process.env.HUBSPOT_API_KEY;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.HUBSPOT_API_KEY;
    } else {
      process.env.HUBSPOT_API_KEY = original;
    }
  });

  it("returns the key when HUBSPOT_API_KEY is set", () => {
    process.env.HUBSPOT_API_KEY = "hsk-test-key";
    expect(getHubSpotApiKey()).toBe("hsk-test-key");
  });

  it("throws when HUBSPOT_API_KEY is not set", () => {
    delete process.env.HUBSPOT_API_KEY;
    expect(() => getHubSpotApiKey()).toThrow("HUBSPOT_API_KEY not set");
  });
});

// ── getHubSpotEnvironment ─────────────────────────────────────────────────────

describe("getHubSpotEnvironment", () => {
  const original = process.env.HUBSPOT_ENVIRONMENT;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.HUBSPOT_ENVIRONMENT;
    } else {
      process.env.HUBSPOT_ENVIRONMENT = original;
    }
  });

  it("returns HUBSPOT_ENVIRONMENT when set", () => {
    process.env.HUBSPOT_ENVIRONMENT = "production";
    expect(getHubSpotEnvironment()).toBe("production");
  });

  it("defaults to 'staging' when HUBSPOT_ENVIRONMENT is not set", () => {
    delete process.env.HUBSPOT_ENVIRONMENT;
    expect(getHubSpotEnvironment()).toBe("staging");
  });
});

// ── hubspotFetch ──────────────────────────────────────────────────────────────

describe("hubspotFetch", () => {
  const original = process.env.HUBSPOT_API_KEY;

  beforeEach(() => {
    process.env.HUBSPOT_API_KEY = "hsk-fetch-key";
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({ ok: true, status: 200 });
  });

  afterEach(() => {
    if (original === undefined) {
      delete process.env.HUBSPOT_API_KEY;
    } else {
      process.env.HUBSPOT_API_KEY = original;
    }
  });

  it("calls fetch with the full HubSpot base URL", async () => {
    await hubspotFetch("/crm/v3/objects/contacts");
    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.hubapi.com/crm/v3/objects/contacts");
  });

  it("includes Authorization Bearer header", async () => {
    await hubspotFetch("/path");
    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = options.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer hsk-fetch-key");
  });

  it("includes Content-Type application/json header", async () => {
    await hubspotFetch("/path");
    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = options.headers as Record<string, string>;
    expect(headers["Content-Type"]).toBe("application/json");
  });

  it("merges method and body from caller options", async () => {
    await hubspotFetch("/path", { method: "POST", body: '{"key":"val"}' });
    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(options.method).toBe("POST");
    expect(options.body).toBe('{"key":"val"}');
  });

  it("allows caller headers to override defaults", async () => {
    await hubspotFetch("/path", {
      headers: { "Content-Type": "text/plain" },
    });
    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = options.headers as Record<string, string>;
    expect(headers["Content-Type"]).toBe("text/plain");
  });

  it("returns the fetch Response object", async () => {
    const mockResponse = { ok: true, status: 200 };
    mockFetch.mockResolvedValueOnce(mockResponse);
    const result = await hubspotFetch("/path");
    expect(result).toBe(mockResponse);
  });

  it("throws when HUBSPOT_API_KEY is not set", async () => {
    delete process.env.HUBSPOT_API_KEY;
    await expect(hubspotFetch("/path")).rejects.toThrow("HUBSPOT_API_KEY not set");
  });
});
