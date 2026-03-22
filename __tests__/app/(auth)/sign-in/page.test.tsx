import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SignInPage from "@/app/(auth)/sign-in/page";

// Mock useSearchParams — jsdom has no router context so the hook returns null without this.
jest.mock("next/navigation", () => ({
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));

// Mock @supabase/ssr so createBrowserClient returns a controlled fake client
const mockSignInWithOtp = jest.fn();
jest.mock("@supabase/ssr", () => ({
  createBrowserClient: jest.fn(() => ({
    auth: { signInWithOtp: mockSignInWithOtp },
  })),
}));

// Footer calls useContactForm() — mock it so this test doesn't need the provider.
jest.mock("../../../../components/ui/Footer", () => ({
  Footer: () => <footer />,
}));

describe("SignInPage", () => {
  beforeEach(() => {
    mockSignInWithOtp.mockReset();
  });

  it("renders without error", () => {
    const { container } = render(<SignInPage />);
    expect(container).toBeTruthy();
  });

  it("renders the sign-in heading", () => {
    render(<SignInPage />);
    expect(screen.getByRole("heading", { name: /sign in/i })).toBeInTheDocument();
  });

  it("renders the email input", () => {
    render(<SignInPage />);
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
  });

  it("renders the submit button", () => {
    render(<SignInPage />);
    expect(
      screen.getByRole("button", { name: /send sign-in link/i })
    ).toBeInTheDocument();
  });

  it("renders the UStart wordmark linking to /", () => {
    render(<SignInPage />);
    const wordmark = screen.getByRole("link", { name: "UStart" });
    expect(wordmark).toHaveAttribute("href", "/");
  });

  it("shows success state after successful OTP submission", async () => {
    mockSignInWithOtp.mockResolvedValueOnce({ error: null });
    render(<SignInPage />);

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "student@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send sign-in link/i }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /check your email/i })).toBeInTheDocument();
    });
  });

  it("shows an error message when the OTP request fails", async () => {
    mockSignInWithOtp.mockResolvedValueOnce({
      error: { message: "Email rate limit exceeded" },
    });
    render(<SignInPage />);

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "student@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send sign-in link/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });

  it("shows a format error for plain text with no @ symbol", () => {
    render(<SignInPage />);

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "abcde" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send sign-in link/i }));

    expect(screen.getByRole("alert")).toBeInTheDocument();
    // Should not have called Supabase at all
    expect(mockSignInWithOtp).not.toHaveBeenCalled();
  });

  it("does not show a format error for valid international-style emails", async () => {
    mockSignInWithOtp.mockResolvedValueOnce({ error: null });
    render(<SignInPage />);

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "student@universidade.br" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send sign-in link/i }));

    await waitFor(() => {
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  it("clears the format error when the user starts typing again", () => {
    render(<SignInPage />);

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "abcde" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send sign-in link/i }));
    expect(screen.getByRole("alert")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "abcde@" },
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
