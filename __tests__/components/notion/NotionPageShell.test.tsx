import { render, screen } from "@testing-library/react";
import { NotionPageShell } from "@/components/notion/NotionPageShell";

jest.mock("../../../components/notion/NotionRenderer", () => ({
  NotionRenderer: () => <div data-testid="notion-renderer-stub" />,
}));

describe("NotionPageShell", () => {
  it("renders without error", () => {
    const { container } = render(
      <NotionPageShell title="Getting Started" blocks={[]} />
    );
    expect(container).toBeTruthy();
  });

  it("renders the title as an h1", () => {
    render(<NotionPageShell title="Parent Hub" blocks={[]} />);
    expect(screen.getByRole("heading", { level: 1, name: "Parent Hub" })).toBeInTheDocument();
  });

  it("renders the NotionRenderer with the provided blocks", () => {
    render(<NotionPageShell title="Test" blocks={[]} />);
    expect(screen.getByTestId("notion-renderer-stub")).toBeInTheDocument();
  });

  it("does not render an Open in Notion link", () => {
    render(<NotionPageShell title="Test" blocks={[]} />);
    expect(screen.queryByRole("link", { name: /open in notion/i })).not.toBeInTheDocument();
  });

  it("renders children above the NotionRenderer", () => {
    render(
      <NotionPageShell title="Test" blocks={[]}>
        <p>Subtitle text</p>
      </NotionPageShell>
    );
    expect(screen.getByText("Subtitle text")).toBeInTheDocument();
    const subtitle = screen.getByText("Subtitle text");
    const renderer = screen.getByTestId("notion-renderer-stub");
    // subtitle should appear before the renderer in document order
    expect(
      subtitle.compareDocumentPosition(renderer) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });
});
