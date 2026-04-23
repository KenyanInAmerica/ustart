import { render, screen } from "@testing-library/react";
import { AccountStrip } from "@/components/dashboard/AccountStrip";
import type { DashboardAccess } from "@/types";

const withPlan: DashboardAccess = {
  membershipRank: 2,
  membershipTier: "explore",
  hasMembership: true,
  hasParentSeat: false,
  hasExplore: false,
  hasConcierge: false,
  hasAgreedToCommunity: false,
  hasAccessedContent: false,
  phoneNumber: null,
  membershipPurchasedAt: "2026-01-12T00:00:00Z",
  role: "student",
  invitedParentEmail: null,
  parentInvitationStatus: null,
  parentInvitationAcceptedAt: null,
  parentShareTasks: true,
  parentShareCalendar: true,
  parentShareContent: true,
};

const noPlan: DashboardAccess = {
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

describe("AccountStrip", () => {
  it("renders without error", () => {
    const { container } = render(<AccountStrip access={withPlan} />);
    expect(container).toBeTruthy();
  });

  it("renders the Billing & Subscription heading", () => {
    render(<AccountStrip access={withPlan} />);
    expect(screen.getByText("Billing & Subscription")).toBeInTheDocument();
  });

  it("shows tier name and purchased date when user has a plan", () => {
    render(<AccountStrip access={withPlan} />);
    // "UStart Explore · purchased Jan 12, 2026"
    expect(screen.getByText(/ustart explore/i)).toBeInTheDocument();
    expect(screen.getByText(/purchased jan 12, 2026/i)).toBeInTheDocument();
  });

  it("renders a Manage link to /dashboard/account when user has a plan", () => {
    render(<AccountStrip access={withPlan} />);
    const link = screen.getByRole("link", { name: /manage/i });
    expect(link).toHaveAttribute("href", "/dashboard/account");
  });

  it("shows 'No active plan' text linking to /pricing when no plan", () => {
    render(<AccountStrip access={noPlan} />);
    const link = screen.getByRole("link", { name: /no active plan/i });
    expect(link).toHaveAttribute("href", "/pricing");
  });

  it("does not render a Manage link when no plan", () => {
    render(<AccountStrip access={noPlan} />);
    expect(screen.queryByRole("link", { name: /manage/i })).not.toBeInTheDocument();
  });

  it("handles a null membershipPurchasedAt gracefully", () => {
    render(<AccountStrip access={{ ...withPlan, membershipPurchasedAt: null }} />);
    // Shows tier name without the date segment
    expect(screen.getByText(/ustart explore/i)).toBeInTheDocument();
    expect(screen.queryByText(/purchased/i)).not.toBeInTheDocument();
  });
});
