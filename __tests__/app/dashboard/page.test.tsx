import { render, screen } from "@testing-library/react";
import DashboardPage from "@/app/dashboard/page";

const mockMaybeSingle = jest.fn();

// page.tsx queries user_access for all entitlement fields in one round-trip.
jest.mock("../../../lib/supabase/server", () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        maybeSingle: mockMaybeSingle,
      })),
    })),
  })),
}));

// Greeting and StartHere are async/data-fetching Server Components.
// Stub them so the page test focuses on page-level composition only.
// Their own behaviour is covered by dedicated test files.
jest.mock("../../../components/dashboard/Greeting", () => ({
  Greeting: () => <div data-testid="greeting-stub" />,
}));

jest.mock("../../../components/dashboard/StartHere", () => ({
  StartHere: () => <div data-testid="start-here-stub" />,
}));

describe("DashboardPage", () => {
  beforeEach(() => {
    mockMaybeSingle.mockResolvedValue({
      data: { membership_tier: "lite", has_agreed_to_community: false, first_content_visit_at: null },
      error: null,
    });
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

  it("renders remaining section headings", async () => {
    render(await DashboardPage());
    expect(screen.getByText("Your Content")).toBeInTheDocument();
    expect(screen.getByText(/^Community$/)).toBeInTheDocument();
    expect(screen.getByText(/^Account$/)).toBeInTheDocument();
  });

  it("renders remaining feature placeholder labels", async () => {
    render(await DashboardPage());
    expect(screen.getByText("Feature 4")).toBeInTheDocument();
    expect(screen.getByText("Feature 5")).toBeInTheDocument();
    expect(screen.getByText("Feature 6")).toBeInTheDocument();
  });

  it("renders feature descriptions", async () => {
    render(await DashboardPage());
    expect(screen.getByText(/content cards/i)).toBeInTheDocument();
    // Feature 3 placeholder was replaced by the StartHere component
    expect(screen.queryByText(/onboarding progress strip/i)).not.toBeInTheDocument();
  });
});
