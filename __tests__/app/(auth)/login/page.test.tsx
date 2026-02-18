import { render, screen } from "@testing-library/react";
import LoginPage from "@/app/(auth)/login/page";

describe("LoginPage", () => {
  it("renders without error", () => {
    render(<LoginPage />);
    expect(screen.getByRole("heading", { name: "Sign In" })).toBeInTheDocument();
  });
});
