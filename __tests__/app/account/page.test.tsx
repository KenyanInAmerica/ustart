import { render, screen } from "@testing-library/react";
import AccountPage from "@/app/account/page";

describe("AccountPage", () => {
  it("renders without error", () => {
    render(<AccountPage />);
    expect(
      screen.getByRole("heading", { name: "Account" })
    ).toBeInTheDocument();
  });
});
