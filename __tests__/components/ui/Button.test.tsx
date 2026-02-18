import { render, screen } from "@testing-library/react";
import { Button } from "@/components/ui/Button";

describe("Button", () => {
  it("renders without error", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("renders children", () => {
    render(<Button>Submit</Button>);
    expect(screen.getByText("Submit")).toBeInTheDocument();
  });
});
