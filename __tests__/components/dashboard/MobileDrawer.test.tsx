import { render, screen, fireEvent } from "@testing-library/react";
import { MobileDrawer } from "@/components/dashboard/MobileDrawer";
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
  isOpen: true,
  onClose: jest.fn(),
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

describe("MobileDrawer", () => {
  it("renders when isOpen is true", () => {
    const { container } = render(<MobileDrawer {...defaultProps} />);
    expect(container).toBeTruthy();
    expect(screen.getByText("UStart")).toBeInTheDocument();
  });

  it("renders nothing when isOpen is false", () => {
    const { container } = render(
      <MobileDrawer {...defaultProps} isOpen={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders all nav items with full access", () => {
    render(<MobileDrawer {...defaultProps} />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /my content/i })).toBeInTheDocument();
    expect(screen.getByText("Account & Billing")).toBeInTheDocument();
  });

  it("renders locked links when access is restricted", () => {
    render(<MobileDrawer {...defaultProps} access={noAccess} />);
    expect(screen.getByRole("link", { name: /^community$/i })).toHaveAttribute(
      "href",
      "/dashboard/community"
    );
    expect(screen.getByRole("link", { name: /parent pack/i })).toHaveAttribute(
      "href",
      "/pricing"
    );
  });

  it("renders My Content as a direct link", () => {
    render(<MobileDrawer {...defaultProps} access={noAccess} />);
    expect(screen.getByRole("link", { name: /my content/i })).toHaveAttribute(
      "href",
      "/dashboard/content"
    );
  });

  it("shows Parent Pack in the drawer when unlocked", () => {
    render(<MobileDrawer {...defaultProps} />);
    expect(screen.getByRole("link", { name: /parent pack/i })).toHaveAttribute(
      "href",
      "/dashboard/content/parent-pack"
    );
  });

  it("routes locked Parent Pack to /pricing", () => {
    render(<MobileDrawer {...defaultProps} access={noAccess} />);
    expect(screen.getByRole("link", { name: /parent pack/i })).toHaveAttribute(
      "href",
      "/pricing"
    );
  });

  it("does not highlight My Content when Parent Pack is active", () => {
    mockUsePathname.mockReturnValue("/dashboard/content/parent-pack");
    render(<MobileDrawer {...defaultProps} />);
    expect(screen.getByRole("link", { name: /^my content$/i }).className).not.toMatch(
      /text-\[#3083DC\]/
    );
    mockUsePathname.mockReturnValue("/dashboard");
  });

  it("calls onClose when the overlay backdrop is clicked", () => {
    const onClose = jest.fn();
    render(<MobileDrawer {...defaultProps} onClose={onClose} />);
    const backdrop = document.querySelector('[aria-hidden="true"]') as HTMLElement;
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the close button is clicked", () => {
    const onClose = jest.fn();
    render(<MobileDrawer {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /close navigation/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders the user email and initials", () => {
    render(<MobileDrawer {...defaultProps} />);
    expect(screen.getByText("student@example.com")).toBeInTheDocument();
    expect(screen.getByText("SE")).toBeInTheDocument();
  });

  it("shows Parent Account badge when role is parent", () => {
    render(<MobileDrawer {...defaultProps} access={{ ...fullAccess, role: "parent" }} />);
    expect(screen.getByText("Parent Account")).toBeInTheDocument();
  });

  it("does not show Parent Account badge for student role", () => {
    render(<MobileDrawer {...defaultProps} />);
    expect(screen.queryByText("Parent Account")).not.toBeInTheDocument();
  });
});
