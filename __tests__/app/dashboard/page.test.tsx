import { render, screen } from "@testing-library/react";
import DashboardPage from "@/app/dashboard/page";
import type { DashboardAccess } from "@/types";

const mockAccess: DashboardAccess = {
  membershipRank: 1,
  membershipTier: "lite",
  hasMembership: true,
  hasParentSeat: false,
  hasExplore: false,
  hasConcierge: false,
  hasAgreedToCommunity: false,
  hasAccessedContent: false,
  phoneNumber: null,
};

// page.tsx uses fetchDashboardAccess and fetchWhatsappLink (React.cache wrappers)
// — mock the module so tests don't require a live Supabase client.
jest.mock("../../../lib/dashboard/access", () => ({
  fetchDashboardAccess: jest.fn(),
  fetchWhatsappLink: jest.fn(),
}));

import { fetchDashboardAccess, fetchWhatsappLink } from "../../../lib/dashboard/access";

// Greeting and StartHere are async Server Components tested in their own files.
jest.mock("../../../components/dashboard/Greeting", () => ({
  Greeting: () => <div data-testid="greeting-stub" />,
}));

jest.mock("../../../components/dashboard/StartHere", () => ({
  StartHere: () => <div data-testid="start-here-stub" />,
}));

// ContentCards is a pure presentational Server Component tested in its own file.
jest.mock("../../../components/dashboard/ContentCards", () => ({
  ContentCards: () => <div data-testid="content-cards-stub" />,
}));

// CommunitySection is a Client Component with interactive state, tested in its own file.
jest.mock("../../../components/dashboard/CommunitySection", () => ({
  CommunitySection: () => <div data-testid="community-section-stub" />,
}));

describe("DashboardPage", () => {
  beforeEach(() => {
    (fetchDashboardAccess as jest.Mock).mockResolvedValue(mockAccess);
    (fetchWhatsappLink as jest.Mock).mockResolvedValue("https://chat.whatsapp.com/test");
  });

  it("renders without error", async () => {
    const { container } = render(await DashboardPage());
    expect(container).toBeTruthy();
  });

  it("renders the Greeting component", async () => {
    render(await DashboardPage());
    expect(screen.getByTestId("greeting-stub")).toBeInTheDocument();
  });

  it("renders the StartHere component", async () => {
    render(await DashboardPage());
    expect(screen.getByTestId("start-here-stub")).toBeInTheDocument();
  });

  it("renders the ContentCards component", async () => {
    render(await DashboardPage());
    expect(screen.getByTestId("content-cards-stub")).toBeInTheDocument();
  });

  it("renders the CommunitySection component", async () => {
    render(await DashboardPage());
    expect(screen.getByTestId("community-section-stub")).toBeInTheDocument();
  });

  it("renders section headings", async () => {
    render(await DashboardPage());
    expect(screen.getByText("Your Content")).toBeInTheDocument();
    expect(screen.getByText(/^Community$/)).toBeInTheDocument();
    expect(screen.getByText(/^Account$/)).toBeInTheDocument();
  });

  it("renders the Feature 6 placeholder for the account section", async () => {
    render(await DashboardPage());
    expect(screen.getByText("Feature 6")).toBeInTheDocument();
  });
});
