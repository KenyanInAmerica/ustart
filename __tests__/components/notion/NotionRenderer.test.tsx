import { render, screen } from "@testing-library/react";
import type { BlockObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { NotionRenderer } from "@/components/notion/NotionRenderer";

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
  return { id: `block-${type}-${Math.random()}`, type, [type]: extra } as unknown as BlockObjectResponse;
}

describe("NotionRenderer", () => {
  it("renders without error for an empty block list", () => {
    const { container } = render(<NotionRenderer blocks={[]} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("renders a single paragraph block", () => {
    render(
      <NotionRenderer blocks={[block("paragraph", { rich_text: rt("Single paragraph") })]} />
    );
    expect(screen.getByText("Single paragraph")).toBeInTheDocument();
  });

  it("wraps consecutive bulleted_list_item blocks in a single <ul>", () => {
    const blocks: BlockObjectResponse[] = [
      block("bulleted_list_item", { rich_text: rt("Apple") }),
      block("bulleted_list_item", { rich_text: rt("Banana") }),
      block("bulleted_list_item", { rich_text: rt("Cherry") }),
    ];
    const { container } = render(<NotionRenderer blocks={blocks} />);
    const lists = container.querySelectorAll("ul");
    expect(lists).toHaveLength(1);
    expect(container.querySelectorAll("li")).toHaveLength(3);
  });

  it("wraps consecutive numbered_list_item blocks in a single <ol>", () => {
    const blocks: BlockObjectResponse[] = [
      block("numbered_list_item", { rich_text: rt("Step 1") }),
      block("numbered_list_item", { rich_text: rt("Step 2") }),
    ];
    const { container } = render(<NotionRenderer blocks={blocks} />);
    const lists = container.querySelectorAll("ol");
    expect(lists).toHaveLength(1);
    expect(container.querySelectorAll("li")).toHaveLength(2);
  });

  it("separates non-adjacent bulleted lists into distinct <ul> elements", () => {
    const blocks: BlockObjectResponse[] = [
      block("bulleted_list_item", { rich_text: rt("First list item") }),
      block("paragraph", { rich_text: rt("Interrupting paragraph") }),
      block("bulleted_list_item", { rich_text: rt("Second list item") }),
    ];
    const { container } = render(<NotionRenderer blocks={blocks} />);
    expect(container.querySelectorAll("ul")).toHaveLength(2);
  });

  it("renders mixed block types in document order", () => {
    const blocks: BlockObjectResponse[] = [
      block("heading_1", { rich_text: rt("Title") }),
      block("paragraph", { rich_text: rt("Body text") }),
      block("divider", {}),
    ];
    const { container } = render(<NotionRenderer blocks={blocks} />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByText("Body text")).toBeInTheDocument();
    expect(container.querySelector("hr")).toBeInTheDocument();
  });

  it("applies the className prop to the wrapper div", () => {
    const { container } = render(
      <NotionRenderer blocks={[]} className="custom-class" />
    );
    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("renders mixed bullet and numbered lists as separate list elements", () => {
    const blocks: BlockObjectResponse[] = [
      block("bulleted_list_item", { rich_text: rt("Bullet") }),
      block("numbered_list_item", { rich_text: rt("Number") }),
    ];
    const { container } = render(<NotionRenderer blocks={blocks} />);
    expect(container.querySelector("ul")).toBeInTheDocument();
    expect(container.querySelector("ol")).toBeInTheDocument();
  });
});
