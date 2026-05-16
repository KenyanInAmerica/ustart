/** @jest-environment node */

describe("getNotionClient", () => {
  const originalKey = process.env.NOTION_API_KEY;

  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    // Restore original env state after every test
    if (originalKey === undefined) {
      delete process.env.NOTION_API_KEY;
    } else {
      process.env.NOTION_API_KEY = originalKey;
    }
  });

  it("throws when NOTION_API_KEY is not set", async () => {
    delete process.env.NOTION_API_KEY;
    const { getNotionClient } = await import("../../../lib/notion/client");
    expect(() => getNotionClient()).toThrow("NOTION_API_KEY is not set");
  });

  it("returns a Client instance when the key is set", async () => {
    process.env.NOTION_API_KEY = "secret_test_key";
    const { getNotionClient } = await import("../../../lib/notion/client");
    const client = getNotionClient();
    expect(client).toBeDefined();
  });

  it("returns the same instance on subsequent calls (singleton)", async () => {
    process.env.NOTION_API_KEY = "secret_test_key";
    const { getNotionClient } = await import("../../../lib/notion/client");
    const c1 = getNotionClient();
    const c2 = getNotionClient();
    expect(c1).toBe(c2);
  });
});
