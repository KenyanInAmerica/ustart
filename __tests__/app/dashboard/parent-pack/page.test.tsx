import { render, screen } from "@testing-library/react";
import ParentPackPage from "@/app/dashboard/parent-pack/page";

jest.mock("../../../../lib/actions/trackContentVisit", () => ({
  trackContentVisit: jest.fn().mockResolvedValue(undefined),
}));

describe("ParentPackPage", () => {
  it("renders without error", async () => {
    const { container } = render(await ParentPackPage());
    expect(container).toBeTruthy();
  });

  it("renders the Parent Pack heading", async () => {
    render(await ParentPackPage());
    expect(screen.getByText("Parent Pack")).toBeInTheDocument();
  });

  it("renders the coming soon placeholder", async () => {
    render(await ParentPackPage());
    expect(screen.getByText(/content coming soon/i)).toBeInTheDocument();
  });
});
