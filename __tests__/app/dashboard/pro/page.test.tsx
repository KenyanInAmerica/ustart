import { render, screen } from "@testing-library/react";
import ExplorePage from "@/app/dashboard/explore/page";
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

// redirect is called when the user lacks entitlement — mock prevents thrown errors.
jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

import { fetchDashboardAccess } from "../../../../lib/dashboard/access";
import { redirect } from "next/navigation";

const exploreAccess: DashboardAccess = {
  membershipRank: 2,
  membershipTier: "explore",
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

describe("ExplorePage", () => {
  beforeEach(() => {
    (fetchDashboardAccess as jest.Mock).mockResolvedValue(exploreAccess);
    (redirect as unknown as jest.Mock).mockReset();
  });

  it("renders without error", async () => {
    const { container } = render(await ExplorePage());
    expect(container).toBeTruthy();
  });

  it("renders the page heading", async () => {
    render(await ExplorePage());
    expect(screen.getByRole("heading", { name: /ustart explore/i })).toBeInTheDocument();
  });

  it("renders the content grid", async () => {
    render(await ExplorePage());
    expect(screen.getByTestId("content-grid-stub")).toBeInTheDocument();
  });

  it("redirects to /dashboard when membership_rank is below 2", async () => {
    (fetchDashboardAccess as jest.Mock).mockResolvedValue({ ...exploreAccess, membershipRank: 1 });
    await ExplorePage();
    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });
});
