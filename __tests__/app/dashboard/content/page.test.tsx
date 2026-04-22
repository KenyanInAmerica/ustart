import { render, screen } from "@testing-library/react";
import DashboardContentPage from "@/app/dashboard/content/page";

jest.mock("../../../../components/dashboard/ContentCardsSection", () => ({
  ContentCardsSection: () => <div data-testid="content-cards-stub" />,
}));

describe("DashboardContentPage", () => {
  it("renders without error", async () => {
    const { container } = render(await DashboardContentPage());
    expect(container).toBeTruthy();
  });

  it("renders the page heading and subtitle", async () => {
    render(await DashboardContentPage());
    expect(screen.getByRole("heading", { name: /my content/i })).toBeInTheDocument();
    expect(screen.getByText("Access your UStart resources.")).toBeInTheDocument();
  });

  it("renders the content cards section", async () => {
    render(await DashboardContentPage());
    expect(screen.getByTestId("content-cards-stub")).toBeInTheDocument();
  });
});
