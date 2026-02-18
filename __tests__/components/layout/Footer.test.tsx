import { render, screen } from "@testing-library/react";
import { Footer } from "@/components/layout/Footer";

describe("Footer", () => {
  it("renders without error", () => {
    const { container } = render(<Footer />);
    expect(container).toBeTruthy();
  });

  it("renders a footer element", () => {
    render(<Footer />);
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });
});
