import { render, screen } from "@testing-library/react";
import { Sidebar } from "@/components/dashboard/Sidebar";

const defaultProps = {
  userEmail: "student@example.com",
  userInitials: "SE",
  planName: "UStart Lite",
  hasMembership: true,
};

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(() => "/dashboard"),
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));

jest.mock("@supabase/ssr", () => ({
  createBrowserClient: jest.fn(() => ({
    auth: { signOut: jest.fn().mockResolvedValue({}) },
  })),
}));

describe("Sidebar", () => {
  it("renders without error", () => {
    const { container } = render(<Sidebar {...defaultProps} />);
    expect(container).toBeTruthy();
  });

  it("renders the UStart wordmark", () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText("UStart")).toBeInTheDocument();
  });

  it("renders all nav section labels", () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText("Main")).toBeInTheDocument();
    expect(screen.getByText("My Content")).toBeInTheDocument();
    // "Community" appears as both section label and nav item — assert at least one exists
    expect(screen.getAllByText("Community").length).toBeGreaterThan(0);
    expect(screen.getByText("Account")).toBeInTheDocument();
  });

  it("renders the Dashboard link as active when on /dashboard", () => {
    render(<Sidebar {...defaultProps} />);
    const dashLink = screen.getByRole("link", { name: /dashboard/i });
    expect(dashLink).toHaveAttribute("href", "/dashboard");
    // Active link has bg-white/[0.07] applied — check the class contains the token
    expect(dashLink.className).toMatch(/bg-white/);
  });

  it("renders Account & Billing link pointing to /dashboard/account", () => {
    render(<Sidebar {...defaultProps} />);
    const link = screen.getByRole("link", { name: /account & billing/i });
    expect(link).toHaveAttribute("href", "/dashboard/account");
  });

  it("renders locked items with a Locked badge and no link", () => {
    render(<Sidebar {...defaultProps} />);
    const badges = screen.getAllByText("Locked");
    expect(badges.length).toBeGreaterThan(0);
    // Parent Pack, Explore, Concierge, Community are locked — rendered as div, not link
    expect(screen.queryByRole("link", { name: /parent pack/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /explore/i })).not.toBeInTheDocument();
  });

  it("renders UStart Lite as a clickable link when hasMembership is true", () => {
    render(<Sidebar {...defaultProps} hasMembership={true} />);
    expect(screen.getByRole("link", { name: /ustart lite/i })).toHaveAttribute(
      "href",
      "/dashboard/lite"
    );
  });

  it("renders UStart Lite as locked when hasMembership is false", () => {
    render(<Sidebar {...defaultProps} hasMembership={false} />);
    expect(screen.queryByRole("link", { name: /ustart lite/i })).not.toBeInTheDocument();
    // Locked badge count increases by one (UStart Lite joins the locked group)
    expect(screen.getAllByText("Locked").length).toBeGreaterThan(1);
  });

  it("renders the user email and plan name", () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText("student@example.com")).toBeInTheDocument();
    // "UStart Lite" appears as both nav item label and footer plan name
    expect(screen.getAllByText("UStart Lite").length).toBeGreaterThan(0);
  });

  it("renders the user initials in the avatar", () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText("SE")).toBeInTheDocument();
  });

  it("renders the sign out button", () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument();
  });
});
