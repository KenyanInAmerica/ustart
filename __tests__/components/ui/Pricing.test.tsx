import { render, screen } from "@testing-library/react";
import { Pricing } from "@/components/ui/Pricing";

describe("Pricing", () => {
  it("renders without error", () => {
    const { container } = render(<Pricing />);
    expect(container).toBeTruthy();
  });

  it("renders the section heading", () => {
    render(<Pricing />);
    expect(
      screen.getByRole("heading", { name: /start where you are/i })
    ).toBeInTheDocument();
  });

  it("renders all three plan names", () => {
    render(<Pricing />);
    expect(screen.getByText("Lite")).toBeInTheDocument();
    expect(screen.getByText("Basic")).toBeInTheDocument();
    expect(screen.getByText("Premium")).toBeInTheDocument();
  });

  it("renders all three plan prices", () => {
    render(<Pricing />);
    expect(screen.getByText("$49")).toBeInTheDocument();
    expect(screen.getByText("$99")).toBeInTheDocument();
    expect(screen.getByText("$199")).toBeInTheDocument();
  });

  it("shows the Most Popular badge on the Basic plan only", () => {
    render(<Pricing />);
    const badges = screen.getAllByText("Most Popular");
    expect(badges).toHaveLength(1);
  });

  it("renders Get Started links pointing to /signup", () => {
    render(<Pricing />);
    const links = screen.getAllByRole("link", { name: /get started/i });
    expect(links).toHaveLength(3);
    links.forEach((link) => expect(link).toHaveAttribute("href", "/signup"));
  });
});
