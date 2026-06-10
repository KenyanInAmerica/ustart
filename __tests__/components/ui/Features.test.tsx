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
    expect(screen.getByText("Land ready, not rattled")).toBeInTheDocument();
    expect(screen.getByText("Your first 7 days, planned")).toBeInTheDocument();
    expect(screen.getByText("Banking & money under control")).toBeInTheDocument();
    expect(screen.getByText("Your parents won't panic")).toBeInTheDocument();
    expect(screen.getByText("Matched with someone who's been there")).toBeInTheDocument();
    expect(screen.getByText("The stuff that trips everyone up")).toBeInTheDocument();
  });

  it("renders text labels instead of icon elements", () => {
    const { container } = render(<Features />);
    expect(screen.getByText("Plane Departure")).toBeInTheDocument();
    expect(screen.getByText("Admin & Compliance")).toBeInTheDocument();
    expect(container.querySelector("#features i")).not.toBeInTheDocument();
  });

  it("has the #features id for smooth-scroll anchor", () => {
    const { container } = render(<Features />);
    expect(container.querySelector("#features")).toBeInTheDocument();
  });
});
