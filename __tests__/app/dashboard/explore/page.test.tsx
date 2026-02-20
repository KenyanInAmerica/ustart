import { render, screen } from "@testing-library/react";
import ExplorePage from "@/app/dashboard/explore/page";

jest.mock("../../../../lib/actions/trackContentVisit", () => ({
  trackContentVisit: jest.fn().mockResolvedValue(undefined),
}));

describe("ExplorePage", () => {
  it("renders without error", async () => {
    const { container } = render(await ExplorePage());
    expect(container).toBeTruthy();
  });

  it("renders the Explore heading", async () => {
    render(await ExplorePage());
    expect(screen.getByText("Explore")).toBeInTheDocument();
  });

  it("renders the coming soon placeholder", async () => {
    render(await ExplorePage());
    expect(screen.getByText(/content coming soon/i)).toBeInTheDocument();
  });
});
