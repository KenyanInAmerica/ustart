import { render, screen } from "@testing-library/react";
import PremiumPage from "@/app/dashboard/premium/page";

jest.mock("../../../../lib/actions/trackContentVisit", () => ({
  trackContentVisit: jest.fn().mockResolvedValue(undefined),
}));

describe("PremiumPage", () => {
  it("renders without error", async () => {
    const { container } = render(await PremiumPage());
    expect(container).toBeTruthy();
  });

  it("renders the page heading", async () => {
    render(await PremiumPage());
    expect(screen.getByRole("heading", { name: /ustart premium/i })).toBeInTheDocument();
  });

  it("renders the coming soon placeholder text", async () => {
    render(await PremiumPage());
    expect(screen.getByText(/content coming soon/i)).toBeInTheDocument();
  });
});
