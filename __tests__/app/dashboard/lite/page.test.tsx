import { render, screen } from "@testing-library/react";
import LitePage from "@/app/dashboard/content/lite/page";
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

const liteAccess: DashboardAccess = {
  membershipRank: 1,
  membershipTier: "lite",
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
  parentShareTasks: true,
  parentShareCalendar: true,
  parentShareContent: true,
};

describe("LitePage (index)", () => {
  beforeEach(() => {
    (fetchDashboardAccess as jest.Mock).mockResolvedValue(liteAccess);
    (redirect as unknown as jest.Mock).mockReset();
  });

  it("redirects to the first module slug when modules are available", async () => {
    (getNotionChildPages as jest.Mock).mockResolvedValue([
      { id: "m1", title: "Banking Basics", slug: "banking-basics", notionUrl: "" },
      { id: "m2", title: "Credit 101", slug: "credit-101", notionUrl: "" },
    ]);

    await LitePage();

    expect(redirect).toHaveBeenCalledWith("/dashboard/content/lite/banking-basics");
  });

  it("shows placeholder when Notion returns no modules", async () => {
    (getNotionChildPages as jest.Mock).mockResolvedValue([]);

    render(await LitePage());

    expect(screen.getByText(/content coming soon/i)).toBeInTheDocument();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("redirects parent users to parent content", async () => {
    (fetchDashboardAccess as jest.Mock).mockResolvedValue({ ...liteAccess, role: "parent" });
    (getNotionChildPages as jest.Mock).mockResolvedValue([]);

    await LitePage();

    expect(redirect).toHaveBeenCalledWith("/dashboard/parent/content");
  });

  it("redirects to /dashboard when membershipRank is below 1", async () => {
    (fetchDashboardAccess as jest.Mock).mockResolvedValue({ ...liteAccess, membershipRank: 0 });
    (getNotionChildPages as jest.Mock).mockResolvedValue([]);

    await LitePage();

    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });
});
