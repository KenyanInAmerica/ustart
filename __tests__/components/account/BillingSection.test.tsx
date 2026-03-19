import { render, screen, fireEvent } from "@testing-library/react";
import { BillingSection } from "@/components/account/BillingSection";
import type { PricingItem } from "@/lib/config/pricing";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));

// Mock AddonModal so we can verify it opens without rendering its full internals.
// Use relative path — jest.mock() doesn't always resolve @/ path aliases.
jest.mock("../../../components/dashboard/AddonModal", () => ({
  AddonModal: ({ item, onClose }: { item: PricingItem; onClose: () => void }) => (
    <div data-testid="addon-modal" data-item-name={item.name}>
      <button onClick={onClose}>close modal</button>
    </div>
  ),
}));

const mockAddonPricing: PricingItem[] = [
  {
    id: "parent_pack",
    name: "Parent Pack",
    description: "Parent access",
    price: 29,
    billing: "one-time",
    features: null,
    is_public: false,
    display_order: 4,
    stripe_product_id: null,
    stripe_price_id: null,
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "explore",
    name: "Explore",
    description: "City guides",
    price: 15,
    billing: "monthly",
    features: null,
    is_public: false,
    display_order: 5,
    stripe_product_id: null,
    stripe_price_id: null,
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "concierge",
    name: "Concierge",
    description: "1-on-1 sessions",
    price: 49,
    billing: "monthly",
    features: null,
    is_public: false,
    display_order: 6,
    stripe_product_id: null,
    stripe_price_id: null,
    updated_at: "2026-01-01T00:00:00Z",
  },
];

const baseProps = {
  membershipTier: null,
  membershipPurchasedAt: null,
  activeAddons: [],
  hasParentSeat: false,
  addonPricing: [],
};

describe("BillingSection", () => {
  it("renders without error", () => {
    const { container } = render(<BillingSection {...baseProps} />);
    expect(container).toBeTruthy();
  });

  it("shows 'No active plan' and a View plans link when no membership", () => {
    render(<BillingSection {...baseProps} />);
    expect(screen.getByText(/no active plan/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view plans/i })).toHaveAttribute(
      "href",
      "/pricing"
    );
  });

  it("shows the tier name and purchased date when membership is active", () => {
    render(
      <BillingSection
        {...baseProps}
        membershipTier="pro"
        membershipPurchasedAt="2026-01-12T00:00:00Z"
      />
    );
    expect(screen.getByText(/ustart pro/i)).toBeInTheDocument();
    expect(screen.getByText(/purchased jan 12, 2026/i)).toBeInTheDocument();
  });

  it("shows an upgrade link when membership tier is not premium", () => {
    render(<BillingSection {...baseProps} membershipTier="lite" />);
    expect(
      screen.getByRole("link", { name: /upgrade your plan/i })
    ).toHaveAttribute("href", "/pricing");
  });

  it("does not show an upgrade link when tier is premium", () => {
    render(<BillingSection {...baseProps} membershipTier="premium" />);
    expect(
      screen.queryByRole("link", { name: /upgrade your plan/i })
    ).not.toBeInTheDocument();
  });

  it("shows 'No active add-ons' when activeAddons is empty and hasParentSeat is false", () => {
    render(<BillingSection {...baseProps} membershipTier="pro" />);
    expect(screen.getByText(/no active add-ons/i)).toBeInTheDocument();
  });

  it("shows Parent Pack in active add-ons when hasParentSeat is true", () => {
    render(<BillingSection {...baseProps} hasParentSeat={true} />);
    expect(screen.getByText("Parent Pack")).toBeInTheDocument();
  });

  it("lists subscription add-ons by display name when present", () => {
    render(
      <BillingSection
        {...baseProps}
        membershipTier="lite"
        activeAddons={[
          { type: "explore", status: "active", current_period_end: null, cancel_at_period_end: false },
          { type: "concierge", status: "active", current_period_end: null, cancel_at_period_end: false },
        ]}
      />
    );
    expect(screen.getByText("Explore")).toBeInTheDocument();
    expect(screen.getByText("Concierge")).toBeInTheDocument();
  });

  it("shows Parent Pack alongside subscription add-ons", () => {
    render(
      <BillingSection
        {...baseProps}
        membershipTier="lite"
        hasParentSeat={true}
        activeAddons={[
          { type: "concierge", status: "active", current_period_end: null, cancel_at_period_end: false },
        ]}
      />
    );
    expect(screen.getByText("Parent Pack")).toBeInTheDocument();
    expect(screen.getByText("Concierge")).toBeInTheDocument();
  });

  it("renders the payment method placeholder row", () => {
    render(<BillingSection {...baseProps} />);
    expect(
      screen.getByText(/payment method — available when billing is connected/i)
    ).toBeInTheDocument();
  });

  it("renders the invoices placeholder row", () => {
    render(<BillingSection {...baseProps} />);
    expect(
      screen.getByText(/invoices — available when billing is connected/i)
    ).toBeInTheDocument();
  });

  it("shows 'Available add-ons' section when user has no add-ons and pricing is provided", () => {
    render(<BillingSection {...baseProps} addonPricing={mockAddonPricing} />);
    expect(screen.getByText(/available add-ons/i)).toBeInTheDocument();
    // All three add-ons should show as available.
    expect(screen.getAllByRole("button", { name: /buy now/i }).length).toBe(3);
  });

  it("excludes owned add-ons from the available section", () => {
    render(
      <BillingSection
        {...baseProps}
        addonPricing={mockAddonPricing}
        activeAddons={[
          { type: "explore", status: "active", current_period_end: null, cancel_at_period_end: false },
        ]}
      />
    );
    // Only parent_pack and concierge should be available.
    expect(screen.getAllByRole("button", { name: /buy now/i }).length).toBe(2);
  });

  it("hides 'Available add-ons' section when user owns all add-ons", () => {
    render(
      <BillingSection
        {...baseProps}
        addonPricing={mockAddonPricing}
        hasParentSeat={true}
        activeAddons={[
          { type: "explore", status: "active", current_period_end: null, cancel_at_period_end: false },
          { type: "concierge", status: "active", current_period_end: null, cancel_at_period_end: false },
        ]}
      />
    );
    expect(screen.queryByText(/available add-ons/i)).not.toBeInTheDocument();
  });

  it("opens the AddonModal when a Buy Now button is clicked", () => {
    render(<BillingSection {...baseProps} addonPricing={mockAddonPricing} />);
    const buyButtons = screen.getAllByRole("button", { name: /buy now/i });
    fireEvent.click(buyButtons[0]);
    expect(screen.getByTestId("addon-modal")).toBeInTheDocument();
  });

  it("closes the AddonModal when onClose is called", () => {
    render(<BillingSection {...baseProps} addonPricing={mockAddonPricing} />);
    fireEvent.click(screen.getAllByRole("button", { name: /buy now/i })[0]);
    fireEvent.click(screen.getByRole("button", { name: /close modal/i }));
    expect(screen.queryByTestId("addon-modal")).not.toBeInTheDocument();
  });

  it("does not render available add-ons section when addonPricing is empty", () => {
    render(<BillingSection {...baseProps} addonPricing={[]} />);
    expect(screen.queryByText(/available add-ons/i)).not.toBeInTheDocument();
  });
});
