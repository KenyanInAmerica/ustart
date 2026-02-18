import { render, screen } from "@testing-library/react";
import ContentPage from "@/app/content/page";

describe("ContentPage", () => {
  it("renders without error", () => {
    render(<ContentPage />);
    expect(
      screen.getByRole("heading", { name: "Content" })
    ).toBeInTheDocument();
  });
});
