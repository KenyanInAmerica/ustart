import { render, screen } from "@testing-library/react";
import { Navbar } from "@/components/ui/Navbar";

describe("Navbar", () => {
  it("renders without error", () => {
    const { container } = render(<Navbar />);
    expect(container).toBeTruthy();
  });

  it("renders a nav element", () => {
    const { container } = render(<Navbar />);
    expect(container.querySelector("nav")).toBeInTheDocument();
  });

  it("renders the UStart wordmark", () => {
    render(<Navbar />);
    expect(screen.getByText("UStart")).toBeInTheDocument();
  });

  it("renders a Sign In link pointing to /login", () => {
    render(<Navbar />);
    const signIn = screen.getByRole("link", { name: "Sign In" });
    expect(signIn).toBeInTheDocument();
    expect(signIn).toHaveAttribute("href", "/login");
  });

  it("renders a Get Started link pointing to /signup", () => {
    render(<Navbar />);
    const getStarted = screen.getByRole("link", { name: "Get Started" });
    expect(getStarted).toBeInTheDocument();
    expect(getStarted).toHaveAttribute("href", "/signup");
  });
});
