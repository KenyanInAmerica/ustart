import { render, screen } from "@testing-library/react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import type { DashboardAccess } from "@/types";

const mockUsePathname = jest.fn(() => "/dashboard");

const fullAccess: DashboardAccess = {
  membershipRank: 3,
  membershipTier: "concierge",
  hasMembership: true,
  hasParentSeat: true,
  hasExplore: true,
  hasConcierge: true,
  hasAgreedToCommunity: true,
  hasAccessedContent: true,
  phoneNumber: null,
  membershipPurchasedAt: null,
  role: "student",
  invitedParentEmail: null,
  parentInvitationStatus: null,
  parentInvitationAcceptedAt: null,
  parentShareTasks: true,
  parentShareCalendar: true,
  parentShareContent: true,
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
  phoneNumber: null,
  membershipPurchasedAt: null,
  role: "student",
  invitedParentEmail: null,
  parentInvitationStatus: null,
  parentInvitationAcceptedAt: null,
  parentShareTasks: true,
  parentShareCalendar: true,
  parentShareContent: true,
};

const defaultProps = {
  userEmail: "student@example.com",
  userInitials: "SE",
  planName: "UStart Lite",
  access: fullAccess,
};

jest.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
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
    expect(screen.getAllByText("My Content").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Community").length).toBeGreaterThan(0);
    expect(screen.getByText("Account")).toBeInTheDocument();
  });

  it("renders the Dashboard link as active when on /dashboard", () => {
    render(<Sidebar {...defaultProps} />);
    const dashLink = screen.getByRole("link", { name: /dashboard/i });
    expect(dashLink).toHaveAttribute("href", "/dashboard");
    expect(dashLink.className).toMatch(/text-\[#3083DC\]/);
  });

  it("renders Account & Billing link pointing to /dashboard/account", () => {
    render(<Sidebar {...defaultProps} />);
    const link = screen.getByRole("link", { name: /account & billing/i });
    expect(link).toHaveAttribute("href", "/dashboard/account");
  });

  it("renders My Content linking to /dashboard/content", () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByRole("link", { name: /my content/i })).toHaveAttribute(
      "href",
      "/dashboard/content"
    );
  });

  it("renders Parent Pack in the navigation when the add-on is active", () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByRole("link", { name: /parent pack/i })).toHaveAttribute(
      "href",
      "/dashboard/content/parent-pack"
    );
  });

  it("routes locked Parent Pack nav to /pricing when the add-on is missing", () => {
    render(<Sidebar {...defaultProps} access={noAccess} />);
    expect(screen.getByRole("link", { name: /parent pack/i })).toHaveAttribute(
      "href",
      "/pricing"
    );
  });

  it("uses the Parent Pack accent when that nav item is active", () => {
    mockUsePathname.mockReturnValue("/dashboard/content/parent-pack");
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByRole("link", { name: /parent pack/i }).className).toMatch(
      /text-\[#F5C842\]/
    );
    mockUsePathname.mockReturnValue("/dashboard");
  });

  it("does not highlight My Content when Parent Pack is active", () => {
    mockUsePathname.mockReturnValue("/dashboard/content/parent-pack");
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByRole("link", { name: /^my content$/i }).className).not.toMatch(
      /text-\[#3083DC\]/
    );
    mockUsePathname.mockReturnValue("/dashboard");
  });

  it("routes Community through its locked nav state when rules are not accepted", () => {
    render(<Sidebar {...defaultProps} access={{ ...fullAccess, hasAgreedToCommunity: false }} />);
    expect(screen.getByRole("link", { name: /^community$/i })).toHaveClass(
      "text-[var(--text-muted)]"
    );
  });

  it("renders the user email and plan name", () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText("student@example.com")).toBeInTheDocument();
    expect(screen.getByText("UStart Lite")).toBeInTheDocument();
  });

  it("renders the user initials in the avatar", () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByText("SE")).toBeInTheDocument();
  });

  it("renders the sign out button", () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument();
  });

  it("shows Parent Account badge when role is parent", () => {
    render(<Sidebar {...defaultProps} access={{ ...fullAccess, role: "parent" }} />);
    expect(screen.getByText("Parent Account")).toBeInTheDocument();
  });

  it("does not show Parent Account badge for student role", () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.queryByText("Parent Account")).not.toBeInTheDocument();
  });
});
