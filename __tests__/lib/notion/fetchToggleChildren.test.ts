/** @jest-environment node */

jest.mock("react", () => {
  const actual = jest.requireActual("react") as Record<string, unknown>;
  return {
    ...actual,
    cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
  };
});

const mockBlocksList = jest.fn();

jest.mock("../../../lib/notion/client", () => ({
  getNotionClient: jest.fn(() => ({
    pages: { retrieve: jest.fn() },
    blocks: { children: { list: mockBlocksList } },
  })),
}));

import type { BlockObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { fetchToggleChildren } from "../../../lib/notion/fetcher";

function makeBlock(type: string, id: string): BlockObjectResponse {
  return { id, type } as unknown as BlockObjectResponse;
}

describe("fetchToggleChildren", () => {
  beforeEach(() => {
    jest.resetModules();
    mockBlocksList.mockReset();
  });

  it("returns an empty map when there are no toggle blocks", async () => {
    const blocks = [makeBlock("paragraph", "p1"), makeBlock("heading_1", "h1")];
    const result = await fetchToggleChildren(blocks);
    expect(result.size).toBe(0);
    expect(mockBlocksList).not.toHaveBeenCalled();
  });

  it("fetches children for each toggle block and stores them in the map", async () => {
    const childBlocks = [makeBlock("paragraph", "child-1")];
    mockBlocksList.mockResolvedValue({ results: childBlocks, next_cursor: null });

    const blocks = [makeBlock("toggle", "toggle-1"), makeBlock("paragraph", "p1")];
    const result = await fetchToggleChildren(blocks);

    expect(result.size).toBe(1);
    expect(result.get("toggle-1")).toEqual(childBlocks);
    expect(mockBlocksList).toHaveBeenCalledTimes(1);
    expect(mockBlocksList).toHaveBeenCalledWith(
      expect.objectContaining({ block_id: "toggle-1" })
    );
  });

  it("fetches children for multiple toggle blocks in parallel", async () => {
    const childA = [makeBlock("paragraph", "child-a")];
    const childB = [makeBlock("paragraph", "child-b")];
    mockBlocksList
      .mockResolvedValueOnce({ results: childA, next_cursor: null })
      .mockResolvedValueOnce({ results: childB, next_cursor: null });

    const blocks = [makeBlock("toggle", "toggle-1"), makeBlock("toggle", "toggle-2")];
    const result = await fetchToggleChildren(blocks);

    expect(result.size).toBe(2);
    expect(result.has("toggle-1")).toBe(true);
    expect(result.has("toggle-2")).toBe(true);
    expect(mockBlocksList).toHaveBeenCalledTimes(2);
  });

  it("stores an empty array for a toggle whose children fetch fails", async () => {
    mockBlocksList.mockRejectedValue(new Error("Network error"));

    const blocks = [makeBlock("toggle", "toggle-fail")];
    const result = await fetchToggleChildren(blocks);

    // getNotionBlocks catches errors and returns [] — the map should reflect that
    expect(result.get("toggle-fail")).toEqual([]);
  });
});
