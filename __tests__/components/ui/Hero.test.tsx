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

  it("renders a Create Account link pointing to /signup", () => {
    render(<Hero />);
    const cta = screen.getByRole("link", { name: /create account/i });
    expect(cta).toBeInTheDocument();
    expect(cta).toHaveAttribute("href", "/signup");
  });

  it("renders the 'See what's inside' link pointing to #features", () => {
    render(<Hero />);
    const link = screen.getByRole("link", { name: /see what.s inside/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "#features");
  });
});
