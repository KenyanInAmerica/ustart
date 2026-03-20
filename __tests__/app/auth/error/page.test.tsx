import { render, screen } from "@testing-library/react";
import AuthErrorPage from "@/app/auth/error/page";

describe("AuthErrorPage", () => {
  it("renders without error", () => {
    const { container } = render(<AuthErrorPage />);
    expect(container).toBeTruthy();
  });

  it("renders the UStart wordmark", () => {
    render(<AuthErrorPage />);
    expect(screen.getByText("UStart")).toBeInTheDocument();
  });

  it("renders the expired link heading", () => {
    render(<AuthErrorPage />);
    expect(screen.getByRole("heading", { name: /this link has expired/i })).toBeInTheDocument();
  });

  it("renders a friendly explanatory message", () => {
    render(<AuthErrorPage />);
    expect(screen.getByText(/single-use and expire/i)).toBeInTheDocument();
  });

  it("renders a 'Request a new link' link pointing to /sign-in", () => {
    render(<AuthErrorPage />);
    const link = screen.getByRole("link", { name: /request a new link/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/sign-in");
  });

  it("renders the UStart wordmark as a link to /", () => {
    render(<AuthErrorPage />);
    const wordmark = screen.getByRole("link", { name: "UStart" });
    expect(wordmark).toHaveAttribute("href", "/");
  });
});
