import { render, screen } from "@testing-library/react";
import AuthErrorPage from "@/app/auth/error/page";

// ContactTriggerLink calls useContactForm() — mock so this test stays provider-free.
jest.mock("../../../../components/ui/ContactTriggerLink", () => ({
  ContactTriggerLink: () => <button>contact form</button>,
}));

describe("AuthErrorPage — default (expired link)", () => {
  it("renders without error", () => {
    const { container } = render(<AuthErrorPage searchParams={{}} />);
    expect(container).toBeTruthy();
  });

  it("renders the UStart wordmark as a link to /", () => {
    render(<AuthErrorPage searchParams={{}} />);
    const wordmark = screen.getByRole("link", { name: "UStart" });
    expect(wordmark).toHaveAttribute("href", "/");
  });

  it("renders the expired link heading", () => {
    render(<AuthErrorPage searchParams={{}} />);
    expect(screen.getByRole("heading", { name: /this link has expired/i })).toBeInTheDocument();
  });

  it("renders a friendly explanatory message", () => {
    render(<AuthErrorPage searchParams={{}} />);
    expect(screen.getByText(/single-use and expire/i)).toBeInTheDocument();
  });

  it("renders a 'Request a new link' link pointing to /sign-in", () => {
    render(<AuthErrorPage searchParams={{}} />);
    const link = screen.getByRole("link", { name: /request a new link/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/sign-in");
  });
});

describe("AuthErrorPage — account_deactivated", () => {
  it("renders the deactivated heading", () => {
    render(<AuthErrorPage searchParams={{ error: "account_deactivated" }} />);
    expect(screen.getByRole("heading", { name: /account deactivated/i })).toBeInTheDocument();
  });

  it("does not show the expired-link heading", () => {
    render(<AuthErrorPage searchParams={{ error: "account_deactivated" }} />);
    expect(screen.queryByRole("heading", { name: /this link has expired/i })).not.toBeInTheDocument();
  });

  it("renders a contact form trigger in the body copy", () => {
    render(<AuthErrorPage searchParams={{ error: "account_deactivated" }} />);
    expect(screen.getByRole("button", { name: /contact form/i })).toBeInTheDocument();
  });

  it("renders a 'Back to home' link pointing to /", () => {
    render(<AuthErrorPage searchParams={{ error: "account_deactivated" }} />);
    const link = screen.getByRole("link", { name: /back to home/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/");
  });

  it("does not render the 'Request a new link' button", () => {
    render(<AuthErrorPage searchParams={{ error: "account_deactivated" }} />);
    expect(screen.queryByRole("link", { name: /request a new link/i })).not.toBeInTheDocument();
  });
});
