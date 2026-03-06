import { render, screen } from "@testing-library/react";
import CommunityRulesPage from "@/app/community-rules/page";

describe("CommunityRulesPage", () => {
  it("renders without error", () => {
    const { container } = render(<CommunityRulesPage />);
    expect(container).toBeTruthy();
  });

  it("renders the Community Rules heading", () => {
    render(<CommunityRulesPage />);
    expect(
      screen.getByRole("heading", { name: /community rules/i })
    ).toBeInTheDocument();
  });

  it("renders the coming soon placeholder text", () => {
    render(<CommunityRulesPage />);
    expect(
      screen.getByText(/full community rules coming soon/i)
    ).toBeInTheDocument();
  });
});
