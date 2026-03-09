import { render, screen } from "@testing-library/react";
import { BillingSection } from "@/components/account/BillingSection";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));

const baseProps = {
  membershipTier: null,
  membershipPurchasedAt: null,
  activeAddons: [],
  hasParentSeat: false,
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

  it("shows Parent Pack when hasParentSeat is true", () => {
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
});
