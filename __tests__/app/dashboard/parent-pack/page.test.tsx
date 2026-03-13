import { render, screen } from "@testing-library/react";
import ParentPackPage from "@/app/dashboard/parent-pack/page";

jest.mock("../../../../lib/actions/trackContentVisit", () => ({
  trackContentVisit: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../../../lib/dashboard/access", () => ({
  fetchDashboardAccess: jest.fn(),
}));

// ParentInvitationSection is a client component tested in its own file.
jest.mock("../../../../components/dashboard/ParentInvitationSection", () => ({
  ParentInvitationSection: () => <div data-testid="invitation-section-stub" />,
}));

import { fetchDashboardAccess } from "../../../../lib/dashboard/access";
import type { DashboardAccess } from "@/types";

const studentAccess: DashboardAccess = {
  membershipRank: 1,
  membershipTier: "lite",
  hasMembership: true,
  hasParentSeat: true,
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

const parentAccess: DashboardAccess = {
  ...studentAccess,
  role: "parent",
};

describe("ParentPackPage", () => {
  beforeEach(() => {
    (fetchDashboardAccess as jest.Mock).mockResolvedValue(studentAccess);
  });

  it("renders without error", async () => {
    const { container } = render(await ParentPackPage());
    expect(container).toBeTruthy();
  });

  it("renders the Parent Pack heading", async () => {
    render(await ParentPackPage());
    expect(screen.getByText("Parent Pack")).toBeInTheDocument();
  });

  it("renders the Parent Resources section heading", async () => {
    render(await ParentPackPage());
    expect(screen.getByText("Parent Resources")).toBeInTheDocument();
  });

  it("renders the invitation section for a student", async () => {
    render(await ParentPackPage());
    expect(screen.getByTestId("invitation-section-stub")).toBeInTheDocument();
  });

  it("hides the invitation section for a parent account", async () => {
    (fetchDashboardAccess as jest.Mock).mockResolvedValue(parentAccess);
    render(await ParentPackPage());
    expect(screen.queryByTestId("invitation-section-stub")).not.toBeInTheDocument();
  });
});
