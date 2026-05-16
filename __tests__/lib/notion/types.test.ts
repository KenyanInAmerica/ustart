/** @jest-environment node */

import { slugify } from "../../../lib/notion/types";

describe("slugify", () => {
  it("lowercases and replaces spaces with hyphens", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("collapses consecutive non-alphanumeric characters into a single hyphen", () => {
    expect(slugify("Banking & Credit   SSN")).toBe("banking-credit-ssn");
  });

  it("strips leading and trailing hyphens", () => {
    expect(slugify("  Leading and trailing  ")).toBe("leading-and-trailing");
  });

  it("strips apostrophes rather than converting them to hyphens", () => {
    expect(slugify("What's New? (2026)")).toBe("whats-new-2026");
  });

  it("strips apostrophes in contractions correctly", () => {
    expect(slugify("Don't Land Without This")).toBe("dont-land-without-this");
  });

  it("strips apostrophes across a full module title", () => {
    expect(slugify("What Actually Matters vs What Doesn't")).toBe(
      "what-actually-matters-vs-what-doesnt"
    );
  });

  it("preserves numbers and handles hyphens in titles", () => {
    expect(slugify("5-7 Common Mistakes")).toBe("5-7-common-mistakes");
  });

  it("preserves numbers", () => {
    expect(slugify("Phase 1 — Before Arrival")).toBe("phase-1-before-arrival");
  });

  it("handles a plain slug-ready string unchanged", () => {
    expect(slugify("Set This Up Before You Fly")).toBe(
      "set-this-up-before-you-fly"
    );
  });

  it("returns empty string for an empty input", () => {
    expect(slugify("")).toBe("");
  });

  it("returns empty string for a string of only special characters", () => {
    expect(slugify("---!!!---")).toBe("");
  });
});
