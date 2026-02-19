import { render, screen } from "@testing-library/react";
import { Navbar } from "@/components/ui/Navbar";

const mockGetUser = jest.fn();

// Mock @supabase/ssr for both the server client used by Navbar and the browser
// client used by the embedded SignOutButton.
jest.mock("@supabase/ssr", () => ({
  createServerClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
  createBrowserClient: jest.fn(() => ({
    auth: { signOut: jest.fn().mockResolvedValue({}) },
  })),
}));

jest.mock("next/headers", () => ({
  cookies: jest.fn(() => ({
    getAll: jest.fn(() => []),
    set: jest.fn(),
  })),
}));

// SignOutButton uses useRouter — provide a no-op stub.
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));

describe("Navbar", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
  });

  it("renders without error", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    const { container } = render(await Navbar());
    expect(container).toBeTruthy();
  });

  it("renders a nav element", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    const { container } = render(await Navbar());
    expect(container.querySelector("nav")).toBeInTheDocument();
  });

  it("renders the UStart wordmark", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    render(await Navbar());
    expect(screen.getByText("UStart")).toBeInTheDocument();
  });

  it("renders Sign In and Get Started links when logged out", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    render(await Navbar());

    const signIn = screen.getByRole("link", { name: "Sign In" });
    expect(signIn).toBeInTheDocument();
    expect(signIn).toHaveAttribute("href", "/sign-in");

    const getStarted = screen.getByRole("link", { name: "Get Started" });
    expect(getStarted).toBeInTheDocument();
    expect(getStarted).toHaveAttribute("href", "/pricing");
  });

  it("renders Dashboard link and Sign out button when logged in", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-123", email: "test@example.com" } },
      error: null,
    });
    render(await Navbar());

    const dashboard = screen.getByRole("link", { name: "Dashboard" });
    expect(dashboard).toBeInTheDocument();
    expect(dashboard).toHaveAttribute("href", "/dashboard");

    expect(
      screen.getByRole("button", { name: /sign out/i })
    ).toBeInTheDocument();
  });

  it("does not render Sign In or Get Started when logged in", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-123", email: "test@example.com" } },
      error: null,
    });
    render(await Navbar());

    expect(screen.queryByRole("link", { name: "Sign In" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Get Started" })).not.toBeInTheDocument();
  });
});
