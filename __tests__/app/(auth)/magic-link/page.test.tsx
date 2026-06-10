import { render, screen } from "@testing-library/react";
import MagicLinkPage from "@/app/(auth)/magic-link/page";

jest.mock("../../../../components/ui/FooterView", () => ({
  FooterView: () => <footer />,
}));

describe("MagicLinkPage", () => {
  it("renders without error", () => {
    render(<MagicLinkPage />);
    expect(
      screen.getByRole("heading", { name: "Check your email" })
    ).toBeInTheDocument();
  });
});
