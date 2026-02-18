import { render, screen } from "@testing-library/react";
import HomePage from "@/app/page";

describe("HomePage", () => {
  it("renders without error", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { name: "UStart" })).toBeInTheDocument();
  });
});
