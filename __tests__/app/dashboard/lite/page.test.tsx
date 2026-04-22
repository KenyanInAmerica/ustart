import { render, screen } from "@testing-library/react";
import LitePage from "@/app/dashboard/content/lite/page";

jest.mock("../../../../lib/actions/trackContentVisit", () => ({
  trackContentVisit: jest.fn().mockResolvedValue(undefined),
}));

// fetchDashboardAccess uses React.cache — mock it and return rank >= 1 so the
// entitlement guard doesn't redirect in tests.
jest.mock("../../../../lib/dashboard/access", () => ({
  fetchDashboardAccess: jest.fn().mockResolvedValue({ membershipRank: 1 }),
}));

// fetchTierContent uses React.cache which isn't available in Jest.
jest.mock("../../../../lib/dashboard/content", () => ({
  fetchTierContent: jest.fn().mockResolvedValue([]),
}));

// ContentGrid is a client component — stub it to avoid loading react-pdf in tests.
jest.mock("../../../../components/dashboard/ContentGrid", () => ({
  ContentGrid: () => <div data-testid="content-grid-stub" />,
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

  it("renders the content grid", async () => {
    render(await LitePage());
    expect(screen.getByTestId("content-grid-stub")).toBeInTheDocument();
  });
});
