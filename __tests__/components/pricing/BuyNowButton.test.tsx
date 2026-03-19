import { render, screen, fireEvent, act } from "@testing-library/react";
import { BuyNowButton } from "@/components/pricing/BuyNowButton";

describe("BuyNowButton", () => {
  it("renders without error", () => {
    const { container } = render(<BuyNowButton />);
    expect(container).toBeTruthy();
  });

  it("renders a Buy Now button by default", () => {
    render(<BuyNowButton />);
    expect(screen.getByRole("button", { name: /buy now/i })).toBeInTheDocument();
  });

  it("shows 'You have access' when ctaState is has-access", () => {
    render(<BuyNowButton ctaState="has-access" />);
    expect(screen.getByText(/you have access/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /buy now/i })).not.toBeInTheDocument();
  });

  it("shows 'Included in your plan' when ctaState is included", () => {
    render(<BuyNowButton ctaState="included" />);
    expect(screen.getByText(/included in your plan/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /buy now/i })).not.toBeInTheDocument();
  });

  it("shows 'coming soon' message after clicking Buy Now with no upsell", () => {
    render(<BuyNowButton ctaState="buy" />);
    fireEvent.click(screen.getByRole("button", { name: /buy now/i }));
    expect(screen.getByText(/checkout coming soon/i)).toBeInTheDocument();
  });

  it("auto-dismisses the 'coming soon' message after 3 seconds", async () => {
    jest.useFakeTimers();
    render(<BuyNowButton ctaState="buy" />);
    fireEvent.click(screen.getByRole("button", { name: /buy now/i }));
    expect(screen.getByText(/checkout coming soon/i)).toBeInTheDocument();
    act(() => { jest.advanceTimersByTime(3000); });
    expect(screen.queryByText(/checkout coming soon/i)).not.toBeInTheDocument();
    jest.useRealTimers();
  });

  it("shows Parent Pack upsell prompt before completing when parentPackUpsell is provided", () => {
    render(<BuyNowButton ctaState="buy" parentPackUpsell={{ price: 29 }} />);
    fireEvent.click(screen.getByRole("button", { name: /buy now/i }));
    expect(screen.getByText("Add Parent Pack?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add parent pack — \$29/i })).toBeInTheDocument();
  });

  it("shows 'coming soon' after clicking 'Add Parent Pack' in upsell prompt", () => {
    render(<BuyNowButton ctaState="buy" parentPackUpsell={{ price: 29 }} />);
    fireEvent.click(screen.getByRole("button", { name: /buy now/i }));
    // Click the "Add Parent Pack" option in the modal.
    fireEvent.click(screen.getByRole("button", { name: /add parent pack — \$29/i }));
    expect(screen.getByText(/checkout coming soon/i)).toBeInTheDocument();
  });

  it("shows 'coming soon' after clicking 'No thanks' in upsell prompt", () => {
    render(<BuyNowButton ctaState="buy" parentPackUpsell={{ price: 29 }} />);
    fireEvent.click(screen.getByRole("button", { name: /buy now/i }));
    fireEvent.click(screen.getByRole("button", { name: /no thanks/i }));
    expect(screen.getByText(/checkout coming soon/i)).toBeInTheDocument();
  });

  it("does not show upsell prompt when parentPackUpsell is null", () => {
    render(<BuyNowButton ctaState="buy" parentPackUpsell={null} />);
    fireEvent.click(screen.getByRole("button", { name: /buy now/i }));
    // Should go straight to "coming soon", not show the upsell.
    expect(screen.queryByText(/add parent pack/i)).not.toBeInTheDocument();
    expect(screen.getByText(/checkout coming soon/i)).toBeInTheDocument();
  });
});
