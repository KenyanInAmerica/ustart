import { render, screen } from "@testing-library/react";
import { Features } from "@/components/ui/Features";

describe("Features", () => {
  it("renders without error", () => {
    const { container } = render(<Features />);
    expect(container).toBeTruthy();
  });

  it("renders the section heading", () => {
    render(<Features />);
    expect(
      screen.getByRole("heading", { name: /everything in one place/i })
    ).toBeInTheDocument();
  });

  it("renders all six feature titles", () => {
    render(<Features />);
    expect(screen.getByText("Gated Content Library")).toBeInTheDocument();
    expect(screen.getByText("PDF Resources & Downloads")).toBeInTheDocument();
    expect(screen.getByText("Flexible Payment Plans")).toBeInTheDocument();
    expect(screen.getByText("Parent Pack")).toBeInTheDocument();
    expect(screen.getByText("Community Access")).toBeInTheDocument();
    expect(screen.getByText("Account & Billing Portal")).toBeInTheDocument();
  });

  it("has the #features id for smooth-scroll anchor", () => {
    const { container } = render(<Features />);
    expect(container.querySelector("#features")).toBeInTheDocument();
  });
});
