import { render, screen } from "@testing-library/react";
import type { BlockObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { NotionBlock } from "@/components/notion/NotionBlock";

// Minimal rich_text item factory
function rt(text: string) {
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

function block(type: string, extra: Record<string, unknown>): BlockObjectResponse {
  return { id: `block-${type}`, type, [type]: extra } as unknown as BlockObjectResponse;
}

describe("NotionBlock — paragraph", () => {
  it("renders text in a <p>", () => {
    render(<NotionBlock block={block("paragraph", { rich_text: rt("Hello paragraph") })} />);
    const p = screen.getByText("Hello paragraph").closest("p");
    expect(p).toBeInTheDocument();
  });
});

describe("NotionBlock — headings", () => {
  it("renders heading_1 as an <h1>", () => {
    render(<NotionBlock block={block("heading_1", { rich_text: rt("Big Title") })} />);
    expect(screen.getByRole("heading", { level: 1, name: "Big Title" })).toBeInTheDocument();
  });

  it("renders heading_2 as an <h2>", () => {
    render(<NotionBlock block={block("heading_2", { rich_text: rt("Section") })} />);
    expect(screen.getByRole("heading", { level: 2, name: "Section" })).toBeInTheDocument();
  });

  it("renders heading_3 as an <h3>", () => {
    render(<NotionBlock block={block("heading_3", { rich_text: rt("Subsection") })} />);
    expect(screen.getByRole("heading", { level: 3, name: "Subsection" })).toBeInTheDocument();
  });
});

describe("NotionBlock — lists", () => {
  it("renders bulleted_list_item as a <li>", () => {
    render(
      <ul>
        <NotionBlock block={block("bulleted_list_item", { rich_text: rt("Bullet") })} />
      </ul>
    );
    expect(screen.getByRole("listitem")).toHaveTextContent("Bullet");
  });

  it("renders numbered_list_item as a <li>", () => {
    render(
      <ol>
        <NotionBlock block={block("numbered_list_item", { rich_text: rt("Step 1") })} />
      </ol>
    );
    expect(screen.getByRole("listitem")).toHaveTextContent("Step 1");
  });
});

describe("NotionBlock — to_do", () => {
  it("renders an unchecked checkbox with text", () => {
    render(
      <NotionBlock block={block("to_do", { rich_text: rt("Buy groceries"), checked: false })} />
    );
    const checkbox = screen.getByRole("checkbox") as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
    expect(screen.getByText("Buy groceries")).toBeInTheDocument();
  });

  it("renders a checked to_do with line-through styling", () => {
    render(
      <NotionBlock block={block("to_do", { rich_text: rt("Done task"), checked: true })} />
    );
    const checkbox = screen.getByRole("checkbox") as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
    // getByText resolves to the inner <span> from NotionRichText; parentElement is the
    // outer <span> on the to_do block that carries the conditional line-through class
    expect(screen.getByText("Done task").parentElement).toHaveClass("line-through");
  });
});

describe("NotionBlock — toggle", () => {
  it("renders a <details> element with the toggle summary", () => {
    render(
      <NotionBlock block={block("toggle", { rich_text: rt("Click to expand") })} />
    );
    expect(screen.getByText(/Click to expand/)).toBeInTheDocument();
    const details = screen.getByText(/Click to expand/).closest("details");
    expect(details).toBeInTheDocument();
  });
});

describe("NotionBlock — callout", () => {
  it("renders callout text with an emoji icon", () => {
    render(
      <NotionBlock
        block={block("callout", {
          rich_text: rt("Important note"),
          icon: { type: "emoji", emoji: "💡" },
          color: "default",
        })}
      />
    );
    expect(screen.getByText("💡")).toBeInTheDocument();
    expect(screen.getByText("Important note")).toBeInTheDocument();
  });

  it("falls back to the ℹ️ icon when no emoji is provided", () => {
    render(
      <NotionBlock
        block={block("callout", {
          rich_text: rt("Info block"),
          icon: null,
          color: "default",
        })}
      />
    );
    expect(screen.getByText("ℹ️")).toBeInTheDocument();
  });
});

describe("NotionBlock — quote", () => {
  it("renders a <blockquote>", () => {
    render(<NotionBlock block={block("quote", { rich_text: rt("Wise words") })} />);
    const bq = screen.getByText("Wise words").closest("blockquote");
    expect(bq).toBeInTheDocument();
  });
});

describe("NotionBlock — divider", () => {
  it("renders an <hr>", () => {
    const { container } = render(<NotionBlock block={block("divider", {})} />);
    expect(container.querySelector("hr")).toBeInTheDocument();
  });
});

describe("NotionBlock — image", () => {
  it("renders an <img> for external images", () => {
    render(
      <NotionBlock
        block={block("image", {
          type: "external",
          external: { url: "https://example.com/photo.jpg" },
          caption: [],
        })}
      />
    );
    const img = screen.getByRole("img") as HTMLImageElement;
    expect(img.src).toBe("https://example.com/photo.jpg");
    expect(img.alt).toBe("Image");
  });

  it("uses the caption text as the alt attribute", () => {
    render(
      <NotionBlock
        block={block("image", {
          type: "external",
          external: { url: "https://example.com/photo.jpg" },
          caption: [{ plain_text: "A scenic view" }],
        })}
      />
    );
    expect(screen.getByRole("img")).toHaveAttribute("alt", "A scenic view");
  });

  it("renders an <img> for Notion-hosted file images", () => {
    render(
      <NotionBlock
        block={block("image", {
          type: "file",
          file: { url: "https://s3.notion.io/secure-image.png", expiry_time: "" },
          caption: [],
        })}
      />
    );
    const img = screen.getByRole("img") as HTMLImageElement;
    expect(img.src).toBe("https://s3.notion.io/secure-image.png");
  });
});

describe("NotionBlock — bookmark", () => {
  it("renders a link to the bookmarked URL", () => {
    render(
      <NotionBlock
        block={block("bookmark", { url: "https://notion.so", caption: [] })}
      />
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "https://notion.so");
    expect(link).toHaveAttribute("target", "_blank");
  });
});

describe("NotionBlock — code", () => {
  it("renders code in a <pre><code> block", () => {
    render(
      <NotionBlock
        block={block("code", {
          rich_text: [{ plain_text: "const x = 42;" }],
          language: "typescript",
          caption: [],
        })}
      />
    );
    const code = screen.getByText("const x = 42;");
    expect(code.tagName).toBe("CODE");
    expect(code.closest("pre")).toBeInTheDocument();
  });
});

describe("NotionBlock — child_page", () => {
  it("renders a link with the page title and a slugified href", () => {
    render(
      <NotionBlock block={block("child_page", { title: "Getting Started Guide" })} />
    );
    const link = screen.getByRole("link", { name: /Getting Started Guide/ });
    expect(link).toHaveAttribute("href", "./getting-started-guide");
    expect(link).toHaveTextContent("Getting Started Guide");
  });
});

describe("NotionBlock — unsupported type", () => {
  it("returns null for an unknown block type", () => {
    const { container } = render(
      <NotionBlock
        block={{ id: "b1", type: "embed" } as unknown as BlockObjectResponse}
      />
    );
    expect(container.firstChild).toBeNull();
  });
});
