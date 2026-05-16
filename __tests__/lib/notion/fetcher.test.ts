/** @jest-environment node */

// Pass React.cache through so cached functions behave like regular async functions in tests
jest.mock("react", () => {
  const actual = jest.requireActual("react") as Record<string, unknown>;
  return {
    ...actual,
    cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
  };
});

const mockPagesRetrieve = jest.fn();
const mockBlocksList = jest.fn();

jest.mock("../../../lib/notion/client", () => ({
  getNotionClient: jest.fn(() => ({
    pages: { retrieve: mockPagesRetrieve },
    blocks: { children: { list: mockBlocksList } },
  })),
}));

function makeRichText(text: string) {
  return [
    {
      type: "text",
      plain_text: text,
      href: null,
      annotations: {
        bold: false,
        italic: false,
        strikethrough: false,
        underline: false,
        code: false,
        color: "default",
      },
    },
  ];
}

// ---- getNotionPage --------------------------------------------------------

describe("getNotionPage", () => {
  beforeEach(() => {
    jest.resetModules();
    mockPagesRetrieve.mockReset();
  });

  it("returns a full page object when the API responds successfully", async () => {
    const fakePage = {
      id: "page-id",
      properties: { title: { type: "title", title: [{ plain_text: "My Page" }] } },
    };
    mockPagesRetrieve.mockResolvedValue(fakePage);
    const { getNotionPage } = await import("../../../lib/notion/fetcher");

    const result = await getNotionPage("page-id");
    expect(result).toEqual(fakePage);
  });

  it("returns null for a partial page response (no properties field)", async () => {
    mockPagesRetrieve.mockResolvedValue({ id: "page-id" });
    const { getNotionPage } = await import("../../../lib/notion/fetcher");

    const result = await getNotionPage("page-id");
    expect(result).toBeNull();
  });

  it("returns null when the API throws", async () => {
    mockPagesRetrieve.mockRejectedValue(new Error("Not found"));
    const { getNotionPage } = await import("../../../lib/notion/fetcher");

    const result = await getNotionPage("missing-id");
    expect(result).toBeNull();
  });
});

// ---- getNotionBlocks ------------------------------------------------------

describe("getNotionBlocks", () => {
  beforeEach(() => {
    jest.resetModules();
    mockBlocksList.mockReset();
  });

  it("returns all blocks from a single page of results", async () => {
    const blocks = [{ id: "b1", type: "paragraph" }, { id: "b2", type: "heading_1" }];
    mockBlocksList.mockResolvedValue({ results: blocks, next_cursor: null });
    const { getNotionBlocks } = await import("../../../lib/notion/fetcher");

    const result = await getNotionBlocks("page-id");
    expect(result).toEqual(blocks);
    expect(mockBlocksList).toHaveBeenCalledTimes(1);
  });

  it("follows pagination cursors until exhausted", async () => {
    const page1 = [{ id: "b1", type: "paragraph" }];
    const page2 = [{ id: "b2", type: "heading_1" }];
    mockBlocksList
      .mockResolvedValueOnce({ results: page1, next_cursor: "cursor-abc" })
      .mockResolvedValueOnce({ results: page2, next_cursor: null });
    const { getNotionBlocks } = await import("../../../lib/notion/fetcher");

    const result = await getNotionBlocks("page-id");
    expect(result).toEqual([...page1, ...page2]);
    expect(mockBlocksList).toHaveBeenCalledTimes(2);
    expect(mockBlocksList).toHaveBeenNthCalledWith(2, expect.objectContaining({ start_cursor: "cursor-abc" }));
  });

  it("returns an empty array when the API throws", async () => {
    mockBlocksList.mockRejectedValue(new Error("Unauthorized"));
    const { getNotionBlocks } = await import("../../../lib/notion/fetcher");

    const result = await getNotionBlocks("page-id");
    expect(result).toEqual([]);
  });
});

// ---- getNotionChildPages --------------------------------------------------

describe("getNotionChildPages", () => {
  beforeEach(() => {
    jest.resetModules();
    mockBlocksList.mockReset();
  });

  it("returns child page entries for child_page blocks", async () => {
    const blocks = [
      { id: "child-1", type: "child_page", child_page: { title: "Getting Started" } },
      { id: "para-1", type: "paragraph", paragraph: { rich_text: makeRichText("intro") } },
    ];
    mockBlocksList.mockResolvedValue({ results: blocks, next_cursor: null });
    const { getNotionChildPages } = await import("../../../lib/notion/fetcher");

    const result = await getNotionChildPages("parent-id");
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: "child-1",
      title: "Getting Started",
      slug: "getting-started",
      notionUrl: "https://notion.so/child1",
    });
  });

  it("returns an empty array when there are no child_page blocks", async () => {
    mockBlocksList.mockResolvedValue({
      results: [{ id: "p1", type: "paragraph", paragraph: { rich_text: [] } }],
      next_cursor: null,
    });
    const { getNotionChildPages } = await import("../../../lib/notion/fetcher");

    const result = await getNotionChildPages("page-id");
    expect(result).toEqual([]);
  });

  it("returns an empty array when the API throws", async () => {
    mockBlocksList.mockRejectedValue(new Error("Network error"));
    const { getNotionChildPages } = await import("../../../lib/notion/fetcher");

    const result = await getNotionChildPages("page-id");
    expect(result).toEqual([]);
  });
});

// ---- getNotionPageTitle ---------------------------------------------------

describe("getNotionPageTitle", () => {
  beforeEach(() => {
    jest.resetModules();
    mockPagesRetrieve.mockReset();
  });

  it("extracts the title from the title property", async () => {
    mockPagesRetrieve.mockResolvedValue({
      id: "page-id",
      properties: {
        title: {
          type: "title",
          title: [{ plain_text: "My Page Title" }],
        },
      },
    });
    const { getNotionPageTitle } = await import("../../../lib/notion/fetcher");

    const result = await getNotionPageTitle("page-id");
    expect(result).toBe("My Page Title");
  });

  it("falls back to the Name property for database pages", async () => {
    mockPagesRetrieve.mockResolvedValue({
      id: "page-id",
      properties: {
        Name: {
          type: "title",
          title: [{ plain_text: "DB Page Name" }],
        },
      },
    });
    const { getNotionPageTitle } = await import("../../../lib/notion/fetcher");

    const result = await getNotionPageTitle("page-id");
    expect(result).toBe("DB Page Name");
  });

  it("returns null when the page is not found", async () => {
    mockPagesRetrieve.mockResolvedValue({ id: "page-id" }); // partial — no properties
    const { getNotionPageTitle } = await import("../../../lib/notion/fetcher");

    const result = await getNotionPageTitle("page-id");
    expect(result).toBeNull();
  });

  it("returns null when the API throws", async () => {
    mockPagesRetrieve.mockRejectedValue(new Error("Not found"));
    const { getNotionPageTitle } = await import("../../../lib/notion/fetcher");

    const result = await getNotionPageTitle("missing-id");
    expect(result).toBeNull();
  });
});
