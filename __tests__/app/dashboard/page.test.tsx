import { render, screen } from "@testing-library/react";
import DashboardPage from "@/app/dashboard/page";

// Greeting is an async Server Component — stub it so the page renders synchronously.
jest.mock("../../../components/dashboard/Greeting", () => ({
  Greeting: () => <div data-testid="greeting-stub" />,
}));

// Async section wrappers — each fetches its own data in production.
// Stubbed here so tests don't require a live Supabase client or pricing API.
jest.mock("../../../components/dashboard/StartHereSection", () => ({
  StartHereSection: () => <div data-testid="start-here-stub" />,
}));

jest.mock("../../../components/dashboard/ContentCardsSection", () => ({
  ContentCardsSection: () => <div data-testid="content-cards-stub" />,
}));

jest.mock("../../../components/dashboard/CommunitySectionWrapper", () => ({
  CommunitySectionWrapper: () => <div data-testid="community-section-stub" />,
}));

jest.mock("../../../components/dashboard/AccountStripSection", () => ({
  AccountStripSection: () => <div data-testid="account-strip-stub" />,
}));

jest.mock("../../../components/dashboard/ParentInvitationWrapper", () => ({
  ParentInvitationWrapper: () => <div data-testid="parent-invitation-stub" />,
}));

describe("DashboardPage", () => {
  it("renders without error", () => {
    const { container } = render(<DashboardPage />);
    expect(container).toBeTruthy();
  });

  it("renders the Greeting component", () => {
    render(<DashboardPage />);
    expect(screen.getByTestId("greeting-stub")).toBeInTheDocument();
  });

  it("renders the StartHere component", () => {
    render(<DashboardPage />);
    expect(screen.getByTestId("start-here-stub")).toBeInTheDocument();
  });

  it("renders the ContentCards component", () => {
    render(<DashboardPage />);
    expect(screen.getByTestId("content-cards-stub")).toBeInTheDocument();
  });

  it("renders the CommunitySection component", () => {
    render(<DashboardPage />);
    expect(screen.getByTestId("community-section-stub")).toBeInTheDocument();
  });

  it("renders the AccountStrip component", () => {
    render(<DashboardPage />);
    expect(screen.getByTestId("account-strip-stub")).toBeInTheDocument();
  });

  it("renders the ParentInvitation component", () => {
    render(<DashboardPage />);
    expect(screen.getByTestId("parent-invitation-stub")).toBeInTheDocument();
  });

  it("renders section headings", () => {
    render(<DashboardPage />);
    expect(screen.getByText("Your Content")).toBeInTheDocument();
    expect(screen.getByText(/^Community$/)).toBeInTheDocument();
    expect(screen.getByText(/^Account$/)).toBeInTheDocument();
  });
});
