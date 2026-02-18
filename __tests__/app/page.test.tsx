import { render, screen } from "@testing-library/react";
import HomePage from "@/app/page";

describe("HomePage", () => {
  it("renders without error", () => {
    const { container } = render(<HomePage />);
    expect(container).toBeTruthy();
  });

  it("renders the main hero headline", () => {
    render(<HomePage />);
    expect(
      screen.getByRole("heading", {
        name: /everything you need to thrive in the united states/i,
      })
    ).toBeInTheDocument();
  });

  it("renders the nav and footer", () => {
    render(<HomePage />);
    expect(screen.getByRole("navigation")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });
});
