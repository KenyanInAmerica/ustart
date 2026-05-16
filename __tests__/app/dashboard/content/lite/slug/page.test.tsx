import { render, screen } from "@testing-library/react";
import LiteModulePage from "@/app/dashboard/content/lite/[slug]/page";
import type { DashboardAccess } from "@/types";

jest.mock("../../../../../../lib/supabase/server", () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }),
    },
  })),
}));

jest.mock("../../../../../../lib/dashboard/access", () => ({
  fetchDashboardAccess: jest.fn(),
}));

jest.mock("../../../../../../lib/dashboard/plan", () => ({
  getTaskForContentUrl: jest.fn().mockResolvedValue(null),
}));

jest.mock("../../../../../../lib/notion/fetcher", () => ({
  getNotionChildPages: jest.fn(),
  getNotionBlocks: jest.fn().mockResolvedValue([]),
  fetchToggleChildren: jest.fn().mockResolvedValue(new Map()),
}));

jest.mock("../../../../../../components/notion/NotionRenderer", () => ({
  NotionRenderer: () => <div data-testid="notion-renderer-stub" />,
}));

jest.mock("../../../../../../components/dashboard/TaskStatusWidget", () => ({
  TaskStatusWidget: () => <div data-testid="task-status-widget-stub" />,
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
  notFound: jest.fn(),
}));

import { fetchDashboardAccess } from "../../../../../../lib/dashboard/access";
import { getNotionChildPages } from "../../../../../../lib/notion/fetcher";
import { redirect, notFound } from "next/navigation";

const defaultSearchParams = {};

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

const mockModules = [
  { id: "m1", title: "Banking Basics", slug: "banking-basics", notionUrl: "https://notion.so/m1" },
  { id: "m2", title: "Credit 101", slug: "credit-101", notionUrl: "https://notion.so/m2" },
  { id: "m3", title: "SSN Guide", slug: "ssn-guide", notionUrl: "https://notion.so/m3" },
];

describe("LiteModulePage", () => {
  beforeEach(() => {
    (fetchDashboardAccess as jest.Mock).mockResolvedValue(liteAccess);
    (getNotionChildPages as jest.Mock).mockResolvedValue(mockModules);
    (redirect as unknown as jest.Mock).mockReset();
    (notFound as unknown as jest.Mock).mockReset();
  });

  it("renders without error", async () => {
    const { container } = render(
      await LiteModulePage({ params: { slug: "banking-basics" }, searchParams: defaultSearchParams })
    );
    expect(container).toBeTruthy();
  });

  it("renders the module title", async () => {
    render(await LiteModulePage({ params: { slug: "banking-basics" }, searchParams: defaultSearchParams }));
    expect(screen.getByRole("heading", { name: "Banking Basics" })).toBeInTheDocument();
  });

  it("renders the NotionRenderer stub", async () => {
    render(await LiteModulePage({ params: { slug: "banking-basics" }, searchParams: defaultSearchParams }));
    expect(screen.getByTestId("notion-renderer-stub")).toBeInTheDocument();
  });

  it("does not render an Open in Notion link", async () => {
    render(await LiteModulePage({ params: { slug: "banking-basics" }, searchParams: defaultSearchParams }));
    expect(screen.queryByRole("link", { name: /open in notion/i })).not.toBeInTheDocument();
  });

  it("renders a Next button linking to the following module", async () => {
    render(await LiteModulePage({ params: { slug: "banking-basics" }, searchParams: defaultSearchParams }));
    const nextLink = screen.getByRole("link", { name: /credit 101 →/i });
    expect(nextLink).toHaveAttribute("href", "/dashboard/content/lite/credit-101");
  });

  it("renders a Previous link on non-first modules", async () => {
    render(await LiteModulePage({ params: { slug: "credit-101" }, searchParams: defaultSearchParams }));
    const prevLink = screen.getByRole("link", { name: /← banking basics/i });
    expect(prevLink).toHaveAttribute("href", "/dashboard/content/lite/banking-basics");
  });

  it("shows Back to My Plan link when from=plan", async () => {
    render(
      await LiteModulePage({ params: { slug: "banking-basics" }, searchParams: { from: "plan" } })
    );
    expect(screen.getByRole("link", { name: /← back to my plan/i })).toHaveAttribute(
      "href",
      "/dashboard"
    );
  });

  it("does not show Back to My Plan link without from param", async () => {
    render(await LiteModulePage({ params: { slug: "banking-basics" }, searchParams: defaultSearchParams }));
    expect(screen.queryByRole("link", { name: /← back to my plan/i })).not.toBeInTheDocument();
  });

  // --- Last module: three upsell cases ---

  it("Case 1 — shows Explore upsell CTA when user has Lite only", async () => {
    render(await LiteModulePage({ params: { slug: "ssn-guide" }, searchParams: defaultSearchParams }));
    expect(screen.getByText(/you've completed ustart lite/i)).toBeInTheDocument();
    const upgradeLink = screen.getByRole("link", { name: /upgrade to explore →/i });
    expect(upgradeLink).toHaveAttribute("href", "/pricing");
  });

  it("Case 2 — shows Go to Explore link when user already has Explore", async () => {
    (fetchDashboardAccess as jest.Mock).mockResolvedValue({
      ...liteAccess,
      hasExplore: true,
    });
    render(await LiteModulePage({ params: { slug: "ssn-guide" }, searchParams: defaultSearchParams }));
    expect(screen.getByText(/you've completed ustart lite/i)).toBeInTheDocument();
    const exploreLink = screen.getByRole("link", { name: /go to explore →/i });
    expect(exploreLink).toHaveAttribute("href", "/dashboard/content/explore");
    expect(screen.queryByRole("link", { name: /upgrade to explore/i })).not.toBeInTheDocument();
  });

  it("Case 3 — shows completion message only when user has Concierge", async () => {
    (fetchDashboardAccess as jest.Mock).mockResolvedValue({
      ...liteAccess,
      hasConcierge: true,
    });
    render(await LiteModulePage({ params: { slug: "ssn-guide" }, searchParams: defaultSearchParams }));
    expect(screen.getByText(/you've completed ustart lite/i)).toBeInTheDocument();
    expect(screen.getByText(/continue your journey/i)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /upgrade to explore/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /go to explore/i })).not.toBeInTheDocument();
  });

  it("does not render a forward module link on the last module", async () => {
    render(await LiteModulePage({ params: { slug: "ssn-guide" }, searchParams: defaultSearchParams }));
    const forwardLinks = screen
      .queryAllByRole("link")
      .filter(
        (l) =>
          l.textContent?.includes("→") &&
          l.getAttribute("href") !== "/pricing" &&
          l.getAttribute("href") !== "/dashboard/content/explore"
      );
    expect(forwardLinks).toHaveLength(0);
  });

  it("calls notFound when the slug has no matching module", async () => {
    await LiteModulePage({ params: { slug: "does-not-exist" }, searchParams: defaultSearchParams });
    expect(notFound).toHaveBeenCalled();
  });

  it("redirects to /dashboard/content when membershipRank is below 1", async () => {
    (fetchDashboardAccess as jest.Mock).mockResolvedValue({ ...liteAccess, membershipRank: 0 });
    await LiteModulePage({ params: { slug: "banking-basics" }, searchParams: defaultSearchParams });
    expect(redirect).toHaveBeenCalledWith("/dashboard/content");
  });

  it("redirects parent users to parent content", async () => {
    (fetchDashboardAccess as jest.Mock).mockResolvedValue({ ...liteAccess, role: "parent" });
    await LiteModulePage({ params: { slug: "banking-basics" }, searchParams: defaultSearchParams });
    expect(redirect).toHaveBeenCalledWith("/dashboard/parent/content");
  });
});
