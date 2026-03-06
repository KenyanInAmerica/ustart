import { render, screen } from "@testing-library/react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import type { DashboardAccess } from "@/types";

const fullAccess: DashboardAccess = {
  membershipRank: 3,
  membershipTier: "premium",
  hasMembership: true,
  hasParentSeat: true,
  hasExplore: true,
  hasConcierge: true,
  hasAgreedToCommunity: true,
  hasAccessedContent: true,
};

const noAccess: DashboardAccess = {
  membershipRank: 0,
  membershipTier: null,
  hasMembership: false,
  hasParentSeat: false,
  hasExplore: false,
  hasConcierge: false,
  hasAgreedToCommunity: false,
  hasAccessedContent: false,
};

const defaultProps = {
  userEmail: "student@example.com",
  userInitials: "SE",
  planName: "UStart Lite",
  access: fullAccess,
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
    expect(screen.getAllByText("Community").length).toBeGreaterThan(0);
    expect(screen.getByText("Account")).toBeInTheDocument();
  });

  it("renders the Dashboard link as active when on /dashboard", () => {
    render(<Sidebar {...defaultProps} />);
    const dashLink = screen.getByRole("link", { name: /dashboard/i });
    expect(dashLink).toHaveAttribute("href", "/dashboard");
    expect(dashLink.className).toMatch(/bg-white/);
  });

  it("renders Account & Billing link pointing to /dashboard/account", () => {
    render(<Sidebar {...defaultProps} />);
    const link = screen.getByRole("link", { name: /account & billing/i });
    expect(link).toHaveAttribute("href", "/dashboard/account");
  });

  it("unlocks Lite, Pro, Premium when membershipRank is 3", () => {
    render(<Sidebar {...defaultProps} access={{ ...fullAccess, membershipRank: 3 }} />);
    expect(screen.getByRole("link", { name: /ustart lite/i })).toHaveAttribute("href", "/dashboard/lite");
    expect(screen.getByRole("link", { name: /ustart pro/i })).toHaveAttribute("href", "/dashboard/pro");
    expect(screen.getByRole("link", { name: /ustart premium/i })).toHaveAttribute("href", "/dashboard/premium");
  });

  it("locks Pro and Premium when membershipRank is 1", () => {
    render(<Sidebar {...defaultProps} access={{ ...noAccess, membershipRank: 1 }} />);
    expect(screen.getByRole("link", { name: /ustart lite/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /ustart pro/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /ustart premium/i })).not.toBeInTheDocument();
  });

  it("locks all content nav when membershipRank is 0", () => {
    render(<Sidebar {...defaultProps} access={noAccess} />);
    expect(screen.queryByRole("link", { name: /ustart lite/i })).not.toBeInTheDocument();
    expect(screen.getAllByText("Locked").length).toBeGreaterThan(0);
  });

  it("locks Parent Pack, Explore, Concierge when addons are false", () => {
    render(<Sidebar {...defaultProps} access={noAccess} />);
    expect(screen.queryByRole("link", { name: /parent pack/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /explore/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /concierge/i })).not.toBeInTheDocument();
  });

  it("unlocks Parent Pack when hasParentSeat is true", () => {
    render(<Sidebar {...defaultProps} access={{ ...noAccess, hasParentSeat: true }} />);
    expect(screen.getByRole("link", { name: /parent pack/i })).toHaveAttribute("href", "/dashboard/parent-pack");
  });

  it("locks Community when hasAgreedToCommunity is false", () => {
    render(<Sidebar {...defaultProps} access={{ ...fullAccess, hasAgreedToCommunity: false }} />);
    expect(screen.queryByRole("link", { name: /^community$/i })).not.toBeInTheDocument();
  });

  it("renders the user email and plan name", () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText("student@example.com")).toBeInTheDocument();
    // "UStart Lite" appears as both a nav item label and the footer plan name
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
