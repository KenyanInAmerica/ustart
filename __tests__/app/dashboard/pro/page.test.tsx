import { render, screen } from "@testing-library/react";
import ProPage from "@/app/dashboard/pro/page";

jest.mock("../../../../lib/actions/trackContentVisit", () => ({
  trackContentVisit: jest.fn().mockResolvedValue(undefined),
}));

describe("ProPage", () => {
  it("renders without error", async () => {
    const { container } = render(await ProPage());
    expect(container).toBeTruthy();
  });

  it("renders the page heading", async () => {
    render(await ProPage());
    expect(screen.getByRole("heading", { name: /ustart pro/i })).toBeInTheDocument();
  });

  it("renders the coming soon placeholder text", async () => {
    render(await ProPage());
    expect(screen.getByText(/content coming soon/i)).toBeInTheDocument();
  });
});
