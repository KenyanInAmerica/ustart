import { render, screen } from "@testing-library/react";
import { Navbar } from "@/components/ui/Navbar";

const mockGetUser = jest.fn();
const mockServiceMaybeSingle = jest.fn();

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

// Service client — used to check is_admin when a user is present.
jest.mock("../../../lib/supabase/service", () => ({
  createServiceClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          maybeSingle: mockServiceMaybeSingle,
        })),
      })),
    })),
  })),
}));

jest.mock("next/headers", () => ({
  cookies: jest.fn(() => ({
    getAll: jest.fn(() => []),
    set: jest.fn(),
  })),
}));

// SignOutButton uses useRouter; GetStartedLink uses usePathname — stub both.
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
  usePathname: jest.fn(() => "/"),
}));

describe("Navbar", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockServiceMaybeSingle.mockReset();
    // Default: not an admin.
    mockServiceMaybeSingle.mockResolvedValue({ data: { is_admin: false } });
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

  it("renders Admin link for admin users", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "admin-1", email: "admin@example.com" } },
      error: null,
    });
    mockServiceMaybeSingle.mockResolvedValueOnce({ data: { is_admin: true } });
    render(await Navbar());

    const adminLink = screen.getByRole("link", { name: "Admin" });
    expect(adminLink).toBeInTheDocument();
    expect(adminLink).toHaveAttribute("href", "/admin");
  });

  it("Admin link appears before Dashboard link in DOM order for admin users", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "admin-1", email: "admin@example.com" } },
      error: null,
    });
    mockServiceMaybeSingle.mockResolvedValueOnce({ data: { is_admin: true } });
    const { container } = render(await Navbar());

    const links = Array.from(container.querySelectorAll("a[href]")).map(
      (el) => (el as HTMLAnchorElement).getAttribute("href")
    );
    const adminIdx = links.indexOf("/admin");
    const dashboardIdx = links.indexOf("/dashboard");
    expect(adminIdx).toBeLessThan(dashboardIdx);
  });

  it("Sign Out button appears after Dashboard link in DOM order", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-1", email: "user@example.com" } },
      error: null,
    });
    const { container } = render(await Navbar());

    const nav = container.querySelector("nav")!;
    const allItems = Array.from(nav.querySelectorAll("a, button"));
    const dashboardIdx = allItems.findIndex(
      (el) => el.getAttribute("href") === "/dashboard"
    );
    const signOutIdx = allItems.findIndex((el) =>
      el.textContent?.toLowerCase().includes("sign out")
    );
    expect(signOutIdx).toBeGreaterThan(dashboardIdx);
  });

  it("renders Get Started link on non-pricing pages", async () => {
    const { usePathname } = jest.requireMock("next/navigation");
    usePathname.mockReturnValue("/");
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    render(await Navbar());
    const link = screen.getByRole("link", { name: "Get Started" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/pricing");
  });

  it("hides Get Started link on the /pricing page", async () => {
    const { usePathname } = jest.requireMock("next/navigation");
    usePathname.mockReturnValue("/pricing");
    mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
    render(await Navbar());
    expect(screen.queryByRole("link", { name: "Get Started" })).not.toBeInTheDocument();
  });
});
