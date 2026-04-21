import { render, screen } from "@testing-library/react";
import { Card } from "@/components/ui/Card";

describe("Card", () => {
  it("renders without error", () => {
    const { container } = render(<Card>Content</Card>);
    expect(container).toBeTruthy();
  });

  it("renders children", () => {
    render(<Card>Card body</Card>);
    expect(screen.getByText("Card body")).toBeInTheDocument();
  });

  it("applies custom shadow and padding classes", () => {
    render(
      <Card shadow="lg" padding="sm">
        Styled card
      </Card>
    );

    expect(screen.getByText("Styled card")).toHaveClass(
      "shadow-[var(--shadow-lg)]",
      "p-4"
    );
  });
});
