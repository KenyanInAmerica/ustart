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
};

// page.tsx uses fetchDashboardAccess (React.cache wrapper) — mock the module
// so tests don't require a live Supabase client.
jest.mock("../../../lib/dashboard/access", () => ({
  fetchDashboardAccess: jest.fn(),
}));

import { fetchDashboardAccess } from "../../../lib/dashboard/access";

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

describe("DashboardPage", () => {
  beforeEach(() => {
    (fetchDashboardAccess as jest.Mock).mockResolvedValue(mockAccess);
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

  it("renders section headings", async () => {
    render(await DashboardPage());
    expect(screen.getByText("Your Content")).toBeInTheDocument();
    expect(screen.getByText(/^Community$/)).toBeInTheDocument();
    expect(screen.getByText(/^Account$/)).toBeInTheDocument();
  });

  it("renders feature placeholder labels for remaining features", async () => {
    render(await DashboardPage());
    expect(screen.getByText("Feature 5")).toBeInTheDocument();
    expect(screen.getByText("Feature 6")).toBeInTheDocument();
  });
});
