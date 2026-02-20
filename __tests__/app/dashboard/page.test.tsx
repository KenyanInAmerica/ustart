import { render, screen } from "@testing-library/react";
import DashboardPage from "@/app/dashboard/page";

// Greeting is an async Server Component (fetches Supabase data).
// Stub it here so the page test doesn't need to wire up SSR mocks.
// Greeting behaviour is covered by __tests__/components/dashboard/Greeting.test.tsx.
jest.mock("../../../components/dashboard/Greeting", () => ({
  Greeting: () => <div data-testid="greeting-stub" />,
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

  it("renders remaining section headings", () => {
    render(<DashboardPage />);
    expect(screen.getByText("Get Started")).toBeInTheDocument();
    expect(screen.getByText("Your Content")).toBeInTheDocument();
    expect(screen.getByText(/^Community$/)).toBeInTheDocument();
    expect(screen.getByText(/^Account$/)).toBeInTheDocument();
  });

  it("renders remaining feature placeholder labels", () => {
    render(<DashboardPage />);
    expect(screen.getByText("Feature 3")).toBeInTheDocument();
    expect(screen.getByText("Feature 4")).toBeInTheDocument();
    expect(screen.getByText("Feature 5")).toBeInTheDocument();
    expect(screen.getByText("Feature 6")).toBeInTheDocument();
  });

  it("renders feature descriptions", () => {
    render(<DashboardPage />);
    expect(screen.getByText(/onboarding progress strip/i)).toBeInTheDocument();
    expect(screen.getByText(/content cards/i)).toBeInTheDocument();
  });
});
