import { render, screen } from "@testing-library/react";
import PremiumPage from "@/app/dashboard/premium/page";
import type { DashboardAccess } from "@/types";

jest.mock("../../../../lib/actions/trackContentVisit", () => ({
  trackContentVisit: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../../../lib/dashboard/access", () => ({
  fetchDashboardAccess: jest.fn(),
}));

jest.mock("../../../../lib/dashboard/content", () => ({
  fetchTierContent: jest.fn().mockResolvedValue([]),
}));

jest.mock("../../../../components/dashboard/ContentGrid", () => ({
  ContentGrid: () => <div data-testid="content-grid-stub" />,
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

import { fetchDashboardAccess } from "../../../../lib/dashboard/access";
import { redirect } from "next/navigation";

const premiumAccess: DashboardAccess = {
  membershipRank: 3,
  membershipTier: "premium",
  hasMembership: true,
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
};

describe("PremiumPage", () => {
  beforeEach(() => {
    (fetchDashboardAccess as jest.Mock).mockResolvedValue(premiumAccess);
    (redirect as unknown as jest.Mock).mockReset();
  });

  it("renders without error", async () => {
    const { container } = render(await PremiumPage());
    expect(container).toBeTruthy();
  });

  it("renders the page heading", async () => {
    render(await PremiumPage());
    expect(screen.getByRole("heading", { name: /ustart premium/i })).toBeInTheDocument();
  });

  it("renders the content grid", async () => {
    render(await PremiumPage());
    expect(screen.getByTestId("content-grid-stub")).toBeInTheDocument();
  });

  it("redirects to /dashboard when membership_rank is below 3", async () => {
    (fetchDashboardAccess as jest.Mock).mockResolvedValue({ ...premiumAccess, membershipRank: 2 });
    await PremiumPage();
    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });
});
