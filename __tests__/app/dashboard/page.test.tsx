import { render, screen } from "@testing-library/react";
import DashboardPage from "@/app/dashboard/page";

describe("DashboardPage", () => {
  it("renders without error", () => {
    render(<DashboardPage />);
    expect(
      screen.getByRole("heading", { name: "Dashboard" })
    ).toBeInTheDocument();
  });
});
