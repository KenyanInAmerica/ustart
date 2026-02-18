import { render, screen } from "@testing-library/react";
import { Footer } from "@/components/ui/Footer";

describe("Footer", () => {
  it("renders without error", () => {
    const { container } = render(<Footer />);
    expect(container).toBeTruthy();
  });

  it("renders a footer element", () => {
    const { container } = render(<Footer />);
    expect(container.querySelector("footer")).toBeInTheDocument();
  });

  it("renders the UStart wordmark linking to /", () => {
    render(<Footer />);
    const wordmark = screen.getByRole("link", { name: "UStart" });
    expect(wordmark).toBeInTheDocument();
    expect(wordmark).toHaveAttribute("href", "/");
  });

  it("renders the Privacy Policy link", () => {
    render(<Footer />);
    const link = screen.getByRole("link", { name: "Privacy Policy" });
    expect(link).toHaveAttribute("href", "/privacy");
  });

  it("renders the Terms link", () => {
    render(<Footer />);
    const link = screen.getByRole("link", { name: "Terms" });
    expect(link).toHaveAttribute("href", "/terms");
  });

  it("renders the Contact link", () => {
    render(<Footer />);
    const link = screen.getByRole("link", { name: "Contact" });
    expect(link).toHaveAttribute("href", "/contact");
  });

  it("renders the copyright notice", () => {
    render(<Footer />);
    expect(screen.getByText(/2026 UStart/)).toBeInTheDocument();
  });
});
