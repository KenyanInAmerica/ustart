import { render, screen } from "@testing-library/react";
import ConciergePage from "@/app/dashboard/concierge/page";

jest.mock("../../../../lib/actions/trackContentVisit", () => ({
  trackContentVisit: jest.fn().mockResolvedValue(undefined),
}));

describe("ConciergePage", () => {
  it("renders without error", async () => {
    const { container } = render(await ConciergePage());
    expect(container).toBeTruthy();
  });

  it("renders the Concierge heading", async () => {
    render(await ConciergePage());
    expect(screen.getByText("Concierge")).toBeInTheDocument();
  });

  it("renders the coming soon placeholder", async () => {
    render(await ConciergePage());
    expect(screen.getByText(/content coming soon/i)).toBeInTheDocument();
  });
});
