import { render, screen, fireEvent } from "@testing-library/react";
import { AddonModal } from "@/components/dashboard/AddonModal";
import type { PricingItem } from "@/lib/config/pricing";

const mockItem: PricingItem = {
  id: "explore",
  name: "Explore",
  description: "School-specific guides and city breakdowns.",
  price: 49,
  billing: "monthly",
  features: ["City guides", "School breakdowns"],
  is_public: false,
  display_order: 5,
  stripe_product_id: null,
  stripe_price_id: null,
  updated_at: "2026-01-01T00:00:00Z",
};

describe("AddonModal", () => {
  it("renders without error", () => {
    const { container } = render(
      <AddonModal item={mockItem} onClose={jest.fn()} />
    );
    expect(container).toBeTruthy();
  });

  it("displays the product name", () => {
    render(<AddonModal item={mockItem} onClose={jest.fn()} />);
    expect(screen.getByText("Explore")).toBeInTheDocument();
  });

  it("displays the price", () => {
    render(<AddonModal item={mockItem} onClose={jest.fn()} />);
    expect(screen.getByText("$49")).toBeInTheDocument();
  });

  it("displays billing cadence", () => {
    render(<AddonModal item={mockItem} onClose={jest.fn()} />);
    expect(screen.getByText(/per month/i)).toBeInTheDocument();
  });

  it("displays the description", () => {
    render(<AddonModal item={mockItem} onClose={jest.fn()} />);
    expect(
      screen.getByText(/school-specific guides/i)
    ).toBeInTheDocument();
  });

  it("displays feature list items", () => {
    render(<AddonModal item={mockItem} onClose={jest.fn()} />);
    expect(screen.getByText("City guides")).toBeInTheDocument();
    expect(screen.getByText("School breakdowns")).toBeInTheDocument();
  });

  it("calls onClose when the close button is clicked", () => {
    const onClose = jest.fn();
    render(<AddonModal item={mockItem} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the backdrop is clicked", () => {
    const onClose = jest.fn();
    render(<AddonModal item={mockItem} onClose={onClose} />);
    fireEvent.click(screen.getByRole("dialog"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows 'coming soon' message after clicking Buy Now", () => {
    render(<AddonModal item={mockItem} onClose={jest.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /buy now/i }));
    expect(screen.getByText(/checkout coming soon/i)).toBeInTheDocument();
  });

  it("shows 'lifetime access' label for one-time billing", () => {
    render(
      <AddonModal
        item={{ ...mockItem, billing: "one-time" }}
        onClose={jest.fn()}
      />
    );
    expect(screen.getByText(/lifetime access/i)).toBeInTheDocument();
  });
});
