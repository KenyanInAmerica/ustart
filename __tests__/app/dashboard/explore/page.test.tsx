import { render, screen } from "@testing-library/react";
import ExplorePage from "@/app/dashboard/content/explore/page";
import type { DashboardAccess } from "@/types";

jest.mock("../../../../lib/actions/trackContentVisit", () => ({
  trackContentVisit: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../../../lib/dashboard/access", () => ({
  fetchDashboardAccess: jest.fn(),
}));

jest.mock("../../../../lib/notion/fetcher", () => ({
  getNotionChildPages: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

import { fetchDashboardAccess } from "../../../../lib/dashboard/access";
import { getNotionChildPages } from "../../../../lib/notion/fetcher";
import { redirect } from "next/navigation";

const exploreAccess: DashboardAccess = {
  membershipRank: 2,
  membershipTier: "explore",
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
  parentShareTasks: true,
  parentShareCalendar: true,
  parentShareContent: true,
};

describe("ExplorePage (index)", () => {
  beforeEach(() => {
    (fetchDashboardAccess as jest.Mock).mockResolvedValue(exploreAccess);
    (redirect as unknown as jest.Mock).mockReset();
  });

  it("redirects to the first module slug when modules are available", async () => {
    (getNotionChildPages as jest.Mock).mockResolvedValue([
      { id: "m1", title: "Tax Filing", slug: "tax-filing", notionUrl: "" },
    ]);

    await ExplorePage();

    expect(redirect).toHaveBeenCalledWith("/dashboard/content/explore/tax-filing");
  });

  it("shows placeholder when Notion returns no modules", async () => {
    (getNotionChildPages as jest.Mock).mockResolvedValue([]);

    render(await ExplorePage());

    expect(screen.getByText(/content coming soon/i)).toBeInTheDocument();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("redirects to /dashboard when membership_rank is below 2", async () => {
    (fetchDashboardAccess as jest.Mock).mockResolvedValue({ ...exploreAccess, membershipRank: 1 });
    (getNotionChildPages as jest.Mock).mockResolvedValue([]);

    await ExplorePage();

    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });

  it("redirects parent users to parent content", async () => {
    (fetchDashboardAccess as jest.Mock).mockResolvedValue({ ...exploreAccess, role: "parent" });
    (getNotionChildPages as jest.Mock).mockResolvedValue([]);

    await ExplorePage();

    expect(redirect).toHaveBeenCalledWith("/dashboard/parent/content");
  });
});
