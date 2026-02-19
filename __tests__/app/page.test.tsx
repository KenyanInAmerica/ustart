import { render, screen } from "@testing-library/react";
import HomePage from "@/app/page";

// Navbar is an async Server Component (reads cookies for Supabase auth state).
// jsdom cannot render async RSC, so stub it with a minimal nav placeholder.
// Navbar behaviour is covered by __tests__/components/ui/Navbar.test.tsx.
// Use a relative path — jest.mock() doesn't always resolve @/ path aliases
// when the test file sits inside a nested directory.
jest.mock("../../components/ui/Navbar", () => ({
  Navbar: () => <nav />,
}));

describe("HomePage", () => {
  it("renders without error", () => {
    const { container } = render(<HomePage />);
    expect(container).toBeTruthy();
  });

  it("renders the nav and footer", () => {
    render(<HomePage />);
    expect(screen.getByRole("navigation")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });
});
