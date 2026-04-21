import { render, screen } from "@testing-library/react";

const mockGetUser = jest.fn();
const mockMaybeSingle = jest.fn();

jest.mock("../../../lib/supabase/server", () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          maybeSingle: mockMaybeSingle,
        })),
      })),
    })),
  })),
}));

jest.mock("../../../lib/dashboard/access", () => ({
  fetchDashboardAccess: jest.fn().mockResolvedValue({
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
  }),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

jest.mock("../../../components/dashboard/Sidebar", () => ({
  Sidebar: () => <div data-testid="sidebar-stub" />,
}));

jest.mock("../../../components/dashboard/MobileDashboardNav", () => ({
  MobileDashboardNav: () => <div data-testid="mobile-nav-stub" />,
}));

jest.mock("../../../components/dashboard/SignOutButton", () => ({
  SignOutButton: () => <button type="button">Sign out</button>,
}));

jest.mock("../../../components/ui/Footer", () => ({
  Footer: () => <footer>Footer</footer>,
}));

import DashboardLayout from "../../../app/dashboard/layout";
import { redirect } from "next/navigation";

describe("DashboardLayout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "student@example.com" } },
    });
    mockMaybeSingle.mockResolvedValue({
      data: {
        id: "user-1",
        intake_completed_at: "2026-04-21T00:00:00.000Z",
        role: "student",
      },
    });
  });

  it("renders the dashboard shell when intake is complete", async () => {
    render(await DashboardLayout({ children: <div>Child page</div> }));

    expect(screen.getByTestId("sidebar-stub")).toBeInTheDocument();
    expect(screen.getByText("Child page")).toBeInTheDocument();
  });

  it("redirects signed-out users to /sign-in", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    await DashboardLayout({ children: <div>Child page</div> });

    expect(redirect).toHaveBeenCalledWith("/sign-in");
  });

  it("redirects student users without intake completion to /intake", async () => {
    mockMaybeSingle.mockResolvedValue({
      data: {
        id: "user-1",
        intake_completed_at: null,
        role: "student",
      },
    });

    await DashboardLayout({ children: <div>Child page</div> });

    expect(redirect).toHaveBeenCalledWith("/intake");
  });

  it("allows parent accounts through even without intake completion", async () => {
    mockMaybeSingle.mockResolvedValue({
      data: {
        id: "user-1",
        intake_completed_at: null,
        role: "parent",
      },
    });

    render(await DashboardLayout({ children: <div>Parent page</div> }));

    expect(screen.getByText("Parent page")).toBeInTheDocument();
    expect(redirect).not.toHaveBeenCalledWith("/intake");
  });
});
