import { render, screen } from "@testing-library/react";
import ParentPackPage from "@/app/dashboard/content/parent-pack/page";

const mockGetUser = jest.fn();

jest.mock("../../../../lib/supabase/server", () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
}));

jest.mock("../../../../lib/dashboard/access", () => ({
  fetchDashboardAccess: jest.fn(),
}));

jest.mock("../../../../lib/dashboard/parentPack", () => ({
  fetchParentPackLinks: jest.fn().mockResolvedValue({
    parentPackNotionUrl: "https://notion.so/parent-pack",
    parentContentNotionUrl: "https://notion.so/parent-content",
  }),
}));

jest.mock("../../../../lib/notion/fetcher", () => ({
  getNotionBlocks: jest.fn().mockResolvedValue([]),
}));

jest.mock("../../../../lib/notion/config", () => ({
  NOTION_PAGE_IDS: { parentPack: "", parentHub: "", lite: "", explore: "", concierge: "" },
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

jest.mock("../../../../components/dashboard/ParentPackManager", () => ({
  ParentPackManager: ({
    initialParentEmail,
    initialStatus,
    parentPackNotionUrl,
  }: {
    initialParentEmail: string | null;
    initialStatus: string | null;
    parentPackNotionUrl: string;
  }) => (
    <div data-testid="invitation-section-stub">
      {initialStatus}:{initialParentEmail ?? "none"}:{parentPackNotionUrl}
    </div>
  ),
}));

jest.mock("../../../../components/notion/NotionPageShell", () => ({
  NotionPageShell: ({ title }: { title: string }) => (
    <div data-testid="notion-page-shell-stub">{title}</div>
  ),
}));

import { fetchDashboardAccess } from "../../../../lib/dashboard/access";
import { redirect } from "next/navigation";
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
  parentShareTasks: true,
  parentShareCalendar: true,
  parentShareContent: true,
};

const acceptedAccess: DashboardAccess = {
  ...studentAccess,
  invitedParentEmail: "parent@example.com",
  parentInvitationStatus: "accepted",
  parentInvitationAcceptedAt: "2026-04-22T00:00:00.000Z",
};

describe("ParentPackPage — fallback (no Notion page ID)", () => {
  beforeEach(() => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "student-1", email: "student@example.com" } },
    });
    (fetchDashboardAccess as jest.Mock).mockResolvedValue(studentAccess);
    (redirect as unknown as jest.Mock).mockReset();
  });

  it("renders without error", async () => {
    const { container } = render(await ParentPackPage());
    expect(container).toBeTruthy();
  });

  it("renders the Parent Pack heading", async () => {
    render(await ParentPackPage());
    expect(screen.getByText("Parent Pack")).toBeInTheDocument();
  });

  it("renders the invitation manager for a signed-in student", async () => {
    render(await ParentPackPage());
    expect(screen.getByTestId("invitation-section-stub")).toBeInTheDocument();
  });

  it("passes parentPackNotionUrl to the manager when no Notion page ID is configured", async () => {
    render(await ParentPackPage());
    expect(screen.getByTestId("invitation-section-stub")).toHaveTextContent(
      "https://notion.so/parent-pack"
    );
  });

  it("does not render the Notion shell when no Notion page ID is configured", async () => {
    render(await ParentPackPage());
    expect(screen.queryByTestId("notion-page-shell-stub")).not.toBeInTheDocument();
  });

  it("redirects signed-out users to /sign-in", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    await ParentPackPage();
    expect(redirect).toHaveBeenCalledWith("/sign-in");
  });

  it("redirects to /dashboard when hasParentSeat is false", async () => {
    (fetchDashboardAccess as jest.Mock).mockResolvedValue({
      ...studentAccess,
      hasParentSeat: false,
    });
    await ParentPackPage();
    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });

  it("redirects parent users to the parent hub", async () => {
    (fetchDashboardAccess as jest.Mock).mockResolvedValue({
      ...studentAccess,
      role: "parent",
    });
    await ParentPackPage();
    expect(redirect).toHaveBeenCalledWith("/dashboard/parent/hub");
  });

  it("passes the existing invitation state into the client manager", async () => {
    (fetchDashboardAccess as jest.Mock).mockResolvedValue(acceptedAccess);
    render(await ParentPackPage());
    expect(screen.getByTestId("invitation-section-stub")).toHaveTextContent(
      "accepted:parent@example.com"
    );
  });
});
