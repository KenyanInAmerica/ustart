import { render, screen } from "@testing-library/react";
import { Hero } from "@/components/ui/Hero";

describe("Hero", () => {
  it("renders without error", () => {
    const { container } = render(<Hero />);
    expect(container).toBeTruthy();
  });

  it("renders the main headline", () => {
    render(<Hero />);
    expect(
      screen.getByRole("heading", {
        name: /everything you need to thrive in the united states/i,
      })
    ).toBeInTheDocument();
  });

  it("renders the badge text", () => {
    render(<Hero />);
    expect(
      screen.getByText(/built for international students in the us/i)
    ).toBeInTheDocument();
  });

  it("renders the 'See what's inside' link pointing to #features", () => {
    render(<Hero />);
    const link = screen.getByRole("link", { name: /see what.s inside/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "#features");
  });

  it("does not render a Get Started link", () => {
    render(<Hero />);
    expect(
      screen.queryByRole("link", { name: /get started/i })
    ).not.toBeInTheDocument();
  });
});
