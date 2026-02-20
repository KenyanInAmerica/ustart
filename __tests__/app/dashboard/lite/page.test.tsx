import { render, screen } from "@testing-library/react";
import LitePage from "@/app/dashboard/lite/page";

// trackContentVisit is a fire-and-forget server action — stub it out so
// tests don't depend on Supabase connectivity.
jest.mock("../../../../lib/actions/trackContentVisit", () => ({
  trackContentVisit: jest.fn().mockResolvedValue(undefined),
}));

describe("LitePage", () => {
  it("renders without error", async () => {
    const { container } = render(await LitePage());
    expect(container).toBeTruthy();
  });

  it("renders the UStart Lite heading", async () => {
    render(await LitePage());
    expect(screen.getByText("UStart Lite")).toBeInTheDocument();
  });

  it("renders the coming soon placeholder", async () => {
    render(await LitePage());
    expect(screen.getByText(/content coming soon/i)).toBeInTheDocument();
  });
});
