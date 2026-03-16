import { render, screen } from "@testing-library/react";
import ProPage from "@/app/dashboard/pro/page";
import type { DashboardAccess } from "@/types";

jest.mock("../../../../lib/actions/trackContentVisit", () => ({
  trackContentVisit: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../../../lib/dashboard/access", () => ({
  fetchDashboardAccess: jest.fn(),
}));

// redirect is called when the user lacks entitlement — mock prevents thrown errors.
jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

import { fetchDashboardAccess } from "../../../../lib/dashboard/access";
import { redirect } from "next/navigation";

const proAccess: DashboardAccess = {
  membershipRank: 2,
  membershipTier: "pro",
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

describe("ProPage", () => {
  beforeEach(() => {
    (fetchDashboardAccess as jest.Mock).mockResolvedValue(proAccess);
    (redirect as unknown as jest.Mock).mockReset();
  });

  it("renders without error", async () => {
    const { container } = render(await ProPage());
    expect(container).toBeTruthy();
  });

  it("renders the page heading", async () => {
    render(await ProPage());
    expect(screen.getByRole("heading", { name: /ustart pro/i })).toBeInTheDocument();
  });

  it("renders the coming soon placeholder text", async () => {
    render(await ProPage());
    expect(screen.getByText(/content coming soon/i)).toBeInTheDocument();
  });

  it("redirects to /dashboard when membership_rank is below 2", async () => {
    (fetchDashboardAccess as jest.Mock).mockResolvedValue({ ...proAccess, membershipRank: 1 });
    await ProPage();
    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });
});
