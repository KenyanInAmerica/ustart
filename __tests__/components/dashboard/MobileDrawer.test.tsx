import { render, screen, fireEvent } from "@testing-library/react";
import { MobileDrawer } from "@/components/dashboard/MobileDrawer";
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
  phoneNumber: null,
  membershipPurchasedAt: null,
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
  usePathname: jest.fn(() => "/dashboard"),
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
    expect(screen.getByRole("link", { name: /ustart lite/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ustart pro/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ustart premium/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /parent pack/i })).toBeInTheDocument();
    expect(screen.getByText("Account & Billing")).toBeInTheDocument();
  });

  it("renders Locked badges when access is restricted", () => {
    render(<MobileDrawer {...defaultProps} access={noAccess} />);
    expect(screen.getAllByText("Locked").length).toBeGreaterThan(0);
  });

  it("locks all content items when membershipRank is 0", () => {
    render(<MobileDrawer {...defaultProps} access={noAccess} />);
    expect(screen.queryByRole("link", { name: /ustart lite/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /ustart pro/i })).not.toBeInTheDocument();
  });

  it("unlocks Lite only when membershipRank is 1", () => {
    render(<MobileDrawer {...defaultProps} access={{ ...noAccess, membershipRank: 1 }} />);
    expect(screen.getByRole("link", { name: /ustart lite/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /ustart pro/i })).not.toBeInTheDocument();
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
});
