import { render, screen } from "@testing-library/react";
import ExplorePage from "@/app/dashboard/explore/page";
import type { DashboardAccess } from "@/types";

jest.mock("../../../../lib/actions/trackContentVisit", () => ({
  trackContentVisit: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../../../lib/dashboard/access", () => ({
  fetchDashboardAccess: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

import { fetchDashboardAccess } from "../../../../lib/dashboard/access";
import { redirect } from "next/navigation";

const exploreAccess: DashboardAccess = {
  membershipRank: 1,
  membershipTier: "lite",
  hasMembership: true,
  hasParentSeat: false,
  hasExplore: true,
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

describe("ExplorePage", () => {
  beforeEach(() => {
    (fetchDashboardAccess as jest.Mock).mockResolvedValue(exploreAccess);
    (redirect as unknown as jest.Mock).mockReset();
  });

  it("renders without error", async () => {
    const { container } = render(await ExplorePage());
    expect(container).toBeTruthy();
  });

  it("renders the Explore heading", async () => {
    render(await ExplorePage());
    expect(screen.getByText("Explore")).toBeInTheDocument();
  });

  it("renders the coming soon placeholder", async () => {
    render(await ExplorePage());
    expect(screen.getByText(/content coming soon/i)).toBeInTheDocument();
  });

  it("redirects to /dashboard when has_explore is false", async () => {
    (fetchDashboardAccess as jest.Mock).mockResolvedValue({ ...exploreAccess, hasExplore: false });
    await ExplorePage();
    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });
});
