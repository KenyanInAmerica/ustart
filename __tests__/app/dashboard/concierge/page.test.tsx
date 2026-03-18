import { render, screen } from "@testing-library/react";
import ConciergePage from "@/app/dashboard/concierge/page";

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
import type { DashboardAccess } from "@/types";

const conciergeAccess: DashboardAccess = {
  membershipRank: 1,
  membershipTier: "lite",
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
};

describe("ConciergePage", () => {
  beforeEach(() => {
    (fetchDashboardAccess as jest.Mock).mockResolvedValue(conciergeAccess);
    (redirect as unknown as jest.Mock).mockReset();
  });

  it("renders without error", async () => {
    const { container } = render(await ConciergePage());
    expect(container).toBeTruthy();
  });

  it("renders the Concierge heading", async () => {
    render(await ConciergePage());
    expect(screen.getByText("Concierge")).toBeInTheDocument();
  });

  it("renders the content grid", async () => {
    render(await ConciergePage());
    expect(screen.getByTestId("content-grid-stub")).toBeInTheDocument();
  });

  it("redirects to /dashboard when hasConcierge is false", async () => {
    (fetchDashboardAccess as jest.Mock).mockResolvedValue({
      ...conciergeAccess,
      hasConcierge: false,
    });
    await ConciergePage();
    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });
});
