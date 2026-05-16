import { render, screen } from "@testing-library/react";
import type { RichTextItemResponse } from "@notionhq/client/build/src/api-endpoints";
import { NotionRichText } from "@/components/notion/NotionRichText";

function makeTextItem(
  text: string,
  annotations: Partial<RichTextItemResponse["annotations"]> = {},
  href: string | null = null
): RichTextItemResponse {
  return {
    type: "text",
    text: { content: text, link: href ? { url: href } : null },
    plain_text: text,
    href,
    annotations: {
      bold: false,
      italic: false,
      strikethrough: false,
      underline: false,
      code: false,
      color: "default",
      ...annotations,
    },
  } as RichTextItemResponse;
}

describe("NotionRichText", () => {
  it("renders plain text without any wrapper classes", () => {
    render(<NotionRichText richText={[makeTextItem("Hello world")]} />);
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("renders an empty fragment for an empty array", () => {
    const { container } = render(<NotionRichText richText={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("applies font-bold for bold annotation", () => {
    render(<NotionRichText richText={[makeTextItem("Bold text", { bold: true })]} />);
    expect(screen.getByText("Bold text")).toHaveClass("font-bold");
  });

  it("applies italic for italic annotation", () => {
    render(<NotionRichText richText={[makeTextItem("Slanted", { italic: true })]} />);
    expect(screen.getByText("Slanted")).toHaveClass("italic");
  });

  it("applies line-through for strikethrough annotation", () => {
    render(<NotionRichText richText={[makeTextItem("Strike", { strikethrough: true })]} />);
    expect(screen.getByText("Strike")).toHaveClass("line-through");
  });

  it("applies underline for underline annotation", () => {
    render(<NotionRichText richText={[makeTextItem("Under", { underline: true })]} />);
    expect(screen.getByText("Under")).toHaveClass("underline");
  });

  it("applies code styling for code annotation", () => {
    render(<NotionRichText richText={[makeTextItem("const x = 1", { code: true })]} />);
    const el = screen.getByText("const x = 1");
    expect(el).toHaveClass("font-mono");
    expect(el).toHaveClass("text-[var(--accent)]");
  });

  it("renders a link when href is set", () => {
    render(
      <NotionRichText richText={[makeTextItem("Click here", {}, "https://example.com")]} />
    );
    const link = screen.getByRole("link", { name: "Click here" });
    expect(link).toHaveAttribute("href", "https://example.com");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("applies a Tailwind color class for colored text", () => {
    render(<NotionRichText richText={[makeTextItem("Red text", { color: "red" })]} />);
    expect(screen.getByText("Red text")).toHaveClass("text-red-500");
  });

  it("combines multiple annotation classes", () => {
    render(
      <NotionRichText
        richText={[makeTextItem("Bold italic", { bold: true, italic: true })]}
      />
    );
    const el = screen.getByText("Bold italic");
    expect(el).toHaveClass("font-bold");
    expect(el).toHaveClass("italic");
  });

  it("renders multiple segments in order", () => {
    render(
      <NotionRichText
        richText={[makeTextItem("First"), makeTextItem("Second")]}
      />
    );
    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
  });
});
