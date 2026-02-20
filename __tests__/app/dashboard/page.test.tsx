import { render, screen } from "@testing-library/react";
import DashboardPage from "@/app/dashboard/page";

describe("DashboardPage", () => {
  it("renders without error", () => {
    const { container } = render(<DashboardPage />);
    expect(container).toBeTruthy();
  });

  it("renders all section headings", () => {
    render(<DashboardPage />);
    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("Get Started")).toBeInTheDocument();
    expect(screen.getByText("Your Content")).toBeInTheDocument();
    expect(screen.getByText(/^Community$/)).toBeInTheDocument();
    expect(screen.getByText(/^Account$/)).toBeInTheDocument();
  });

  it("renders all feature placeholder labels", () => {
    render(<DashboardPage />);
    expect(screen.getByText("Feature 2")).toBeInTheDocument();
    expect(screen.getByText("Feature 3")).toBeInTheDocument();
    expect(screen.getByText("Feature 4")).toBeInTheDocument();
    expect(screen.getByText("Feature 5")).toBeInTheDocument();
    expect(screen.getByText("Feature 6")).toBeInTheDocument();
  });

  it("renders feature descriptions", () => {
    render(<DashboardPage />);
    expect(screen.getByText(/greeting & user state/i)).toBeInTheDocument();
    expect(screen.getByText(/onboarding progress strip/i)).toBeInTheDocument();
    expect(screen.getByText(/content cards/i)).toBeInTheDocument();
  });
});
