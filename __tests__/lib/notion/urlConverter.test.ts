/** @jest-environment node */

import { isNotionUrl, isUStartContentUrl, extractNotionPageId } from "../../../lib/notion/urlConverter";

const VALID_ID = "abc123def456abc123def456abc123de"; // 32 hex chars

describe("isNotionUrl", () => {
  it("returns true for notion.so URLs", () => {
    expect(isNotionUrl(`https://notion.so/Page-Title-${VALID_ID}`)).toBe(true);
  });

  it("returns true for www.notion.so URLs", () => {
    expect(isNotionUrl(`https://www.notion.so/${VALID_ID}`)).toBe(true);
  });

  it("returns false for non-Notion URLs", () => {
    expect(isNotionUrl("https://example.com/page")).toBe(false);
    expect(isNotionUrl("https://u-start.co.uk/page")).toBe(false);
  });

  it("returns false for invalid URLs", () => {
    expect(isNotionUrl("not-a-url")).toBe(false);
    expect(isNotionUrl("")).toBe(false);
  });

  it("returns false for relative paths", () => {
    expect(isNotionUrl("/dashboard/content/lite/some-slug")).toBe(false);
  });
});

describe("isUStartContentUrl", () => {
  it("returns true for valid lite content paths", () => {
    expect(isUStartContentUrl("/dashboard/content/lite/banking-basics")).toBe(true);
  });

  it("returns true for explore and concierge paths", () => {
    expect(isUStartContentUrl("/dashboard/content/explore/tax-filing")).toBe(true);
    expect(isUStartContentUrl("/dashboard/content/concierge/visa-renewal")).toBe(true);
  });

  it("returns false for unknown tier segments", () => {
    expect(isUStartContentUrl("/dashboard/content/parent-pack/resources")).toBe(false);
  });

  it("returns false for paths without a slug", () => {
    expect(isUStartContentUrl("/dashboard/content/lite")).toBe(false);
    expect(isUStartContentUrl("/dashboard/content/lite/")).toBe(false);
  });

  it("returns false for absolute URLs", () => {
    expect(isUStartContentUrl("https://notion.so/page")).toBe(false);
  });

  it("returns false for other dashboard paths", () => {
    expect(isUStartContentUrl("/dashboard/community")).toBe(false);
  });
});

describe("extractNotionPageId", () => {
  it("extracts a 32-char ID from a simple notion.so URL", () => {
    expect(
      extractNotionPageId(`https://notion.so/${VALID_ID}`)
    ).toBe(VALID_ID);
  });

  it("extracts the ID when preceded by a page title slug", () => {
    expect(
      extractNotionPageId(`https://notion.so/Page-Title-${VALID_ID}`)
    ).toBe(VALID_ID);
  });

  it("extracts the ID from a workspace-namespaced URL", () => {
    expect(
      extractNotionPageId(`https://notion.so/workspace/Page-Title-${VALID_ID}`)
    ).toBe(VALID_ID);
  });

  it("returns null when no 32-char hex segment is present", () => {
    expect(extractNotionPageId("https://notion.so/just-a-title")).toBeNull();
    expect(extractNotionPageId("https://notion.so/")).toBeNull();
  });

  it("returns null for an invalid URL", () => {
    expect(extractNotionPageId("not-a-url")).toBeNull();
  });

  it("is case-insensitive for hex characters", () => {
    const upperID = VALID_ID.toUpperCase();
    expect(
      extractNotionPageId(`https://notion.so/${upperID}`)
    ).toBe(upperID);
  });
});
