/** @jest-environment node */

jest.mock("react", () => {
  const actual = jest.requireActual("react") as Record<string, unknown>;
  return { ...actual, cache: <T extends (...args: never[]) => unknown>(fn: T) => fn };
});

const mockGetUser = jest.fn();
const mockServiceFrom = jest.fn();
const mockPagesRetrieve = jest.fn();

jest.mock("../../../../lib/supabase/server", () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
}));

jest.mock("../../../../lib/supabase/service", () => ({
  createServiceClient: jest.fn(() => ({
    from: mockServiceFrom,
  })),
}));

jest.mock("../../../../lib/notion/client", () => ({
  getNotionClient: jest.fn(() => ({
    pages: { retrieve: mockPagesRetrieve },
  })),
}));

function makeServiceChain(data: unknown) {
  const chain: Record<string, jest.Mock> = {} as Record<string, jest.Mock>;
  const link = jest.fn(() => chain);
  chain.select = link;
  chain.eq = link;
  chain.maybeSingle = jest.fn().mockResolvedValue({ data });
  return chain;
}

const VALID_NOTION_URL =
  "https://notion.so/Page-Title-abc123def456abc123def456abc123de";
const ADMIN_USER = { id: "admin-1" };

import { verifyNotionUrl } from "../../../../lib/actions/admin/verifyNotionUrl";

describe("verifyNotionUrl", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockServiceFrom.mockReset();
    mockPagesRetrieve.mockReset();
  });

  it("returns Forbidden when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const result = await verifyNotionUrl(VALID_NOTION_URL, "lite");

    expect(result.valid).toBe(false);
    expect(result.error).toBe("Forbidden");
  });

  it("returns Forbidden when user is not an admin", async () => {
    mockGetUser.mockResolvedValue({ data: { user: ADMIN_USER } });
    mockServiceFrom.mockReturnValue(makeServiceChain({ is_admin: false }));

    const result = await verifyNotionUrl(VALID_NOTION_URL, "lite");

    expect(result.valid).toBe(false);
    expect(result.error).toBe("Forbidden");
  });

  it("returns error for a non-Notion URL", async () => {
    mockGetUser.mockResolvedValue({ data: { user: ADMIN_USER } });
    mockServiceFrom.mockReturnValue(makeServiceChain({ is_admin: true }));

    const result = await verifyNotionUrl("https://example.com/page", "lite");

    expect(result.valid).toBe(false);
    expect(result.error).toBe("Not a Notion URL");
  });

  it("returns error when the page ID cannot be extracted", async () => {
    mockGetUser.mockResolvedValue({ data: { user: ADMIN_USER } });
    mockServiceFrom.mockReturnValue(makeServiceChain({ is_admin: true }));

    const result = await verifyNotionUrl("https://notion.so/just-a-title", "lite");

    expect(result.valid).toBe(false);
    expect(result.error).toBe("Could not extract page ID from URL");
  });

  it("returns error when Notion API throws (page not found or not shared)", async () => {
    mockGetUser.mockResolvedValue({ data: { user: ADMIN_USER } });
    mockServiceFrom.mockReturnValue(makeServiceChain({ is_admin: true }));
    mockPagesRetrieve.mockRejectedValue(new Error("Could not find page"));

    const result = await verifyNotionUrl(VALID_NOTION_URL, "lite");

    expect(result.valid).toBe(false);
    expect(result.error).toContain("Page not found or not accessible");
  });

  it("returns valid result with title and converted URL on success", async () => {
    mockGetUser.mockResolvedValue({ data: { user: ADMIN_USER } });
    mockServiceFrom.mockReturnValue(makeServiceChain({ is_admin: true }));
    mockPagesRetrieve.mockResolvedValue({
      id: "abc123def456abc123def456abc123de",
      properties: {
        title: {
          type: "title",
          title: [{ plain_text: "Don't Land Without This" }],
        },
      },
    });

    const result = await verifyNotionUrl(VALID_NOTION_URL, "lite");

    expect(result.valid).toBe(true);
    expect(result.pageTitle).toBe("Don't Land Without This");
    expect(result.convertedUrl).toBe("/dashboard/content/lite/dont-land-without-this");
    expect(result.error).toBeNull();
  });

  it("uses slugified page ID as fallback when title is not available", async () => {
    mockGetUser.mockResolvedValue({ data: { user: ADMIN_USER } });
    mockServiceFrom.mockReturnValue(makeServiceChain({ is_admin: true }));
    // Partial page response — no properties
    mockPagesRetrieve.mockResolvedValue({
      id: "abc123def456abc123def456abc123de",
    });

    const result = await verifyNotionUrl(VALID_NOTION_URL, "explore");

    expect(result.valid).toBe(true);
    expect(result.pageTitle).toBeNull();
    expect(result.convertedUrl).toBe(
      "/dashboard/content/explore/abc123def456abc123def456abc123de"
    );
  });
});
