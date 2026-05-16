import { render, screen } from "@testing-library/react";
import { NotionSidebar } from "@/components/notion/NotionSidebar";
import type { NotionChildPage } from "@/lib/notion/types";

const modules: NotionChildPage[] = [
  { id: "m1", title: "Banking Basics", slug: "banking-basics", notionUrl: "https://notion.so/m1" },
  { id: "m2", title: "Credit 101", slug: "credit-101", notionUrl: "https://notion.so/m2" },
  { id: "m3", title: "SSN Guide", slug: "ssn-guide", notionUrl: "https://notion.so/m3" },
];

describe("NotionSidebar", () => {
  it("renders without error", () => {
    const { container } = render(
      <NotionSidebar
        modules={modules}
        currentSlug="banking-basics"
        tier="lite"
        tierLabel="UStart Lite"
      />
    );
    expect(container).toBeTruthy();
  });

  it("renders the tier label", () => {
    render(
      <NotionSidebar
        modules={modules}
        currentSlug="banking-basics"
        tier="lite"
        tierLabel="UStart Lite"
      />
    );
    expect(screen.getAllByText("UStart Lite").length).toBeGreaterThan(0);
  });

  it("renders the module count", () => {
    render(
      <NotionSidebar modules={modules} currentSlug="banking-basics" tier="lite" tierLabel="UStart Lite" />
    );
    expect(screen.getAllByText(/0 of 3 modules/i).length).toBeGreaterThan(0);
  });

  it("renders a link for every module", () => {
    render(
      <NotionSidebar modules={modules} currentSlug="banking-basics" tier="lite" tierLabel="UStart Lite" />
    );
    // Both desktop and mobile render the same links — there will be duplicates
    expect(screen.getAllByRole("link", { name: /Banking Basics/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole("link", { name: /Credit 101/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole("link", { name: /SSN Guide/i }).length).toBeGreaterThanOrEqual(1);
  });

  it("links each module to the correct href", () => {
    render(
      <NotionSidebar modules={modules} currentSlug="banking-basics" tier="lite" tierLabel="UStart Lite" />
    );
    const links = screen.getAllByRole("link", { name: /Credit 101/i });
    expect(links[0]).toHaveAttribute("href", "/dashboard/content/lite/credit-101");
  });

  it("applies active styling to the current module", () => {
    render(
      <NotionSidebar modules={modules} currentSlug="credit-101" tier="lite" tierLabel="UStart Lite" />
    );
    const activeLinks = screen.getAllByRole("link", { name: /Credit 101/i });
    expect(activeLinks[0]).toHaveClass("font-semibold");
  });

  it("does not apply active styling to inactive modules", () => {
    render(
      <NotionSidebar modules={modules} currentSlug="credit-101" tier="lite" tierLabel="UStart Lite" />
    );
    const inactiveLinks = screen.getAllByRole("link", { name: /Banking Basics/i });
    expect(inactiveLinks[0]).not.toHaveClass("font-semibold");
  });

  it("renders a back link to /dashboard/content", () => {
    render(
      <NotionSidebar modules={modules} currentSlug="banking-basics" tier="lite" tierLabel="UStart Lite" />
    );
    const backLinks = screen.getAllByRole("link", { name: /my content/i });
    expect(backLinks[0]).toHaveAttribute("href", "/dashboard/content");
  });

  it("renders the mobile dropdown element", () => {
    const { container } = render(
      <NotionSidebar modules={modules} currentSlug="banking-basics" tier="lite" tierLabel="UStart Lite" />
    );
    expect(container.querySelector("details")).toBeInTheDocument();
  });

  it("shows singular 'module' for a single-item list", () => {
    render(
      <NotionSidebar
        modules={[modules[0]]}
        currentSlug="banking-basics"
        tier="lite"
        tierLabel="UStart Lite"
      />
    );
    expect(screen.getAllByText(/0 of 1 module$/i).length).toBeGreaterThan(0);
  });
});
