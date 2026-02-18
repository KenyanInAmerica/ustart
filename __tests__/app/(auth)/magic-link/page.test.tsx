import { render, screen } from "@testing-library/react";
import MagicLinkPage from "@/app/(auth)/magic-link/page";

describe("MagicLinkPage", () => {
  it("renders without error", () => {
    render(<MagicLinkPage />);
    expect(
      screen.getByRole("heading", { name: "Check Your Email" })
    ).toBeInTheDocument();
  });
});
