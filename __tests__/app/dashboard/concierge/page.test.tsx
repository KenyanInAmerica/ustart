import { render, screen } from "@testing-library/react";
import ConciergePage from "@/app/dashboard/content/concierge/page";
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

const conciergeAccess: DashboardAccess = {
  membershipRank: 3,
  membershipTier: "concierge",
  hasMembership: true,
  hasParentSeat: false,
  hasExplore: false,
  hasConcierge: true,
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

describe("ConciergePage (index)", () => {
  beforeEach(() => {
    (fetchDashboardAccess as jest.Mock).mockResolvedValue(conciergeAccess);
    (redirect as unknown as jest.Mock).mockReset();
  });

  it("redirects to the first module slug when modules are available", async () => {
    (getNotionChildPages as jest.Mock).mockResolvedValue([
      { id: "m1", title: "Visa Extensions", slug: "visa-extensions", notionUrl: "" },
    ]);

    await ConciergePage();

    expect(redirect).toHaveBeenCalledWith("/dashboard/content/concierge/visa-extensions");
  });

  it("shows placeholder when Notion returns no modules", async () => {
    (getNotionChildPages as jest.Mock).mockResolvedValue([]);

    render(await ConciergePage());

    expect(screen.getByText(/content coming soon/i)).toBeInTheDocument();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("redirects to /dashboard when membershipRank is below 3", async () => {
    (fetchDashboardAccess as jest.Mock).mockResolvedValue({ ...conciergeAccess, membershipRank: 2 });
    (getNotionChildPages as jest.Mock).mockResolvedValue([]);

    await ConciergePage();

    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });

  it("redirects parent users to parent content", async () => {
    (fetchDashboardAccess as jest.Mock).mockResolvedValue({ ...conciergeAccess, role: "parent" });
    (getNotionChildPages as jest.Mock).mockResolvedValue([]);

    await ConciergePage();

    expect(redirect).toHaveBeenCalledWith("/dashboard/parent/content");
  });
});
