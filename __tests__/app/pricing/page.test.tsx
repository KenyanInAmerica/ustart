import { render, screen } from "@testing-library/react";
import PricingPage from "@/app/pricing/page";
import type { PricingItem } from "@/lib/config/pricing";
import type { DashboardAccess } from "@/types";

// Use relative paths — jest.mock() doesn't always resolve @/ path aliases.
jest.mock("../../../lib/config/getPricing", () => ({
  getPublicPricing: jest.fn(),
  getPricingById: jest.fn(),
}));

jest.mock("../../../lib/dashboard/access", () => ({
  fetchDashboardAccess: jest.fn(),
}));

// Auth client — mock getUser for auth state checks.
jest.mock("../../../lib/supabase/server", () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: jest.fn() },
  })),
}));

// Navbar and Footer are Server Components with DB calls — mock them out.
jest.mock("../../../components/ui/Navbar", () => ({
  Navbar: () => <nav data-testid="navbar" />,
}));
jest.mock("../../../components/ui/Footer", () => ({
  Footer: () => <footer data-testid="footer" />,
}));

// BuyNowButton renders differently based on ctaState — mock captures the prop for assertions.
jest.mock("../../../components/pricing/BuyNowButton", () => ({
  BuyNowButton: ({
    ctaState,
    parentPackUpsell,
  }: {
    ctaState?: string;
    parentPackUpsell?: { price: number } | null;
  }) => (
    <div
      data-testid="buy-now-button"
      data-cta-state={ctaState ?? "buy"}
      data-has-upsell={parentPackUpsell ? "true" : "false"}
    />
  ),
}));

const { getPublicPricing, getPricingById } = jest.requireMock(
  "../../../lib/config/getPricing"
) as {
  getPublicPricing: jest.Mock;
  getPricingById: jest.Mock;
};

const { fetchDashboardAccess } = jest.requireMock(
  "../../../lib/dashboard/access"
) as { fetchDashboardAccess: jest.Mock };

const { createClient } = jest.requireMock(
  "../../../lib/supabase/server"
) as { createClient: jest.Mock };

const mockTiers: PricingItem[] = [
  {
    id: "lite",
    name: "Lite",
    description: "Core library",
    price: 49,
    billing: "one-time",
    features: ["Core content library", "PDF resources"],
    is_public: true,
    display_order: 1,
    stripe_product_id: null,
    stripe_price_id: null,
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "pro",
    name: "Pro",
    description: "Full library",
    price: 99,
    billing: "one-time",
    features: ["Everything in Lite", "Community access"],
    is_public: true,
    display_order: 2,
    stripe_product_id: null,
    stripe_price_id: null,
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "premium",
    name: "Premium",
    description: "All access",
    price: 199,
    billing: "one-time",
    features: ["Everything in Pro", "1-on-1 sessions"],
    is_public: true,
    display_order: 3,
    stripe_product_id: null,
    stripe_price_id: null,
    updated_at: "2026-01-01T00:00:00Z",
  },
];

const mockParentPack: PricingItem = {
  id: "parent_pack",
  name: "Parent Pack",
  description: "Give a parent their own login",
  price: 29,
  billing: "one-time",
  features: null,
  is_public: false,
  display_order: 4,
  stripe_product_id: null,
  stripe_price_id: null,
  updated_at: "2026-01-01T00:00:00Z",
};

const noAccessState: DashboardAccess = {
  membershipRank: 0,
  membershipTier: null,
  hasMembership: false,
  hasParentSeat: false,
  hasExplore: false,
  hasConcierge: false,
  hasAgreedToCommunity: false,
  hasAccessedContent: false,
  phoneNumber: null,
  membershipPurchasedAt: null,
  role: "student",
  invitedParentEmail: null,
  parentInvitationStatus: null,
  parentInvitationAcceptedAt: null,
};

function setupUnauthenticated() {
  createClient.mockReturnValue({
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
    },
  });
}

function setupAuthenticated(overrides: Partial<DashboardAccess> = {}) {
  createClient.mockReturnValue({
    auth: {
      getUser: jest
        .fn()
        .mockResolvedValue({ data: { user: { id: "user-1" } } }),
    },
  });
  fetchDashboardAccess.mockResolvedValue({ ...noAccessState, ...overrides });
}

beforeEach(() => {
  getPublicPricing.mockResolvedValue(mockTiers);
  getPricingById.mockResolvedValue(mockParentPack);
  setupUnauthenticated();
});

afterEach(() => jest.clearAllMocks());

describe("PricingPage", () => {
  it("renders without error", async () => {
    const { container } = render(await PricingPage());
    expect(container).toBeTruthy();
  });

  it("renders the page heading", async () => {
    render(await PricingPage());
    expect(screen.getByText(/simple, transparent pricing/i)).toBeInTheDocument();
  });

  it("renders all three tier plan names", async () => {
    render(await PricingPage());
    expect(screen.getByText("Lite")).toBeInTheDocument();
    expect(screen.getByText("Pro")).toBeInTheDocument();
    expect(screen.getByText("Premium")).toBeInTheDocument();
  });

  it("renders prices for all tiers", async () => {
    render(await PricingPage());
    expect(screen.getByText("$49")).toBeInTheDocument();
    expect(screen.getByText("$99")).toBeInTheDocument();
    expect(screen.getByText("$199")).toBeInTheDocument();
  });

  it("renders feature items", async () => {
    render(await PricingPage());
    expect(screen.getByText("Core content library")).toBeInTheDocument();
    expect(screen.getByText("Community access")).toBeInTheDocument();
  });

  it("does not render a Parent Pack card for unauthenticated users", async () => {
    render(await PricingPage());
    // Parent Pack has is_public=false — it should not appear as a card.
    expect(screen.queryByText("Parent Pack")).not.toBeInTheDocument();
    expect(screen.queryByText(/parent pack add-on/i)).not.toBeInTheDocument();
  });

  it("renders Navbar and Footer", async () => {
    render(await PricingPage());
    expect(screen.getByTestId("navbar")).toBeInTheDocument();
    expect(screen.getByTestId("footer")).toBeInTheDocument();
  });

  it("renders gracefully when pricing list is empty", async () => {
    getPublicPricing.mockResolvedValue([]);
    render(await PricingPage());
    expect(screen.getByText(/pricing information unavailable/i)).toBeInTheDocument();
  });

  // Fix 2: CTA state for authenticated users.
  it("shows 'buy' ctaState for all tiers when unauthenticated", async () => {
    render(await PricingPage());
    const buttons = screen.getAllByTestId("buy-now-button");
    buttons.forEach((btn) => expect(btn).toHaveAttribute("data-cta-state", "buy"));
  });

  it("shows 'has-access' for Lite when user has Lite (rank 1)", async () => {
    setupAuthenticated({ membershipRank: 1 });
    render(await PricingPage());
    const buttons = screen.getAllByTestId("buy-now-button");
    // buttons are in order: Lite, Pro, Premium
    expect(buttons[0]).toHaveAttribute("data-cta-state", "has-access");
    expect(buttons[1]).toHaveAttribute("data-cta-state", "buy");
    expect(buttons[2]).toHaveAttribute("data-cta-state", "buy");
  });

  it("shows 'included' for Lite and 'has-access' for Pro when user has Pro (rank 2)", async () => {
    setupAuthenticated({ membershipRank: 2 });
    render(await PricingPage());
    const buttons = screen.getAllByTestId("buy-now-button");
    expect(buttons[0]).toHaveAttribute("data-cta-state", "included");
    expect(buttons[1]).toHaveAttribute("data-cta-state", "has-access");
    expect(buttons[2]).toHaveAttribute("data-cta-state", "buy");
  });

  it("shows 'included' for Lite and Pro, 'has-access' for Premium when user has Premium (rank 3)", async () => {
    setupAuthenticated({ membershipRank: 3 });
    render(await PricingPage());
    const buttons = screen.getAllByTestId("buy-now-button");
    expect(buttons[0]).toHaveAttribute("data-cta-state", "included");
    expect(buttons[1]).toHaveAttribute("data-cta-state", "included");
    expect(buttons[2]).toHaveAttribute("data-cta-state", "has-access");
  });

  // Fix 5: Parent Pack upsell.
  it("passes parentPackUpsell for authenticated users without Parent Pack on 'buy' tiers", async () => {
    setupAuthenticated({ membershipRank: 0, hasParentSeat: false });
    render(await PricingPage());
    const buttons = screen.getAllByTestId("buy-now-button");
    // All 3 tiers are "buy" — all should have upsell data.
    buttons.forEach((btn) =>
      expect(btn).toHaveAttribute("data-has-upsell", "true")
    );
  });

  it("does not pass parentPackUpsell when user already has Parent Pack", async () => {
    setupAuthenticated({ membershipRank: 0, hasParentSeat: true });
    render(await PricingPage());
    const buttons = screen.getAllByTestId("buy-now-button");
    buttons.forEach((btn) =>
      expect(btn).toHaveAttribute("data-has-upsell", "false")
    );
  });

  it("does not pass parentPackUpsell for unauthenticated users", async () => {
    render(await PricingPage());
    const buttons = screen.getAllByTestId("buy-now-button");
    buttons.forEach((btn) =>
      expect(btn).toHaveAttribute("data-has-upsell", "false")
    );
  });

  // Fix 1: upsell only fires for tier IDs, not add-ons or custom products.
  it("does not pass parentPackUpsell for a non-tier public product", async () => {
    const tiersWithAddon: PricingItem[] = [
      ...mockTiers,
      {
        id: "explore",
        name: "Explore",
        description: "Extra content",
        price: 29,
        billing: "one-time",
        features: null,
        is_public: true,
        display_order: 4,
        stripe_product_id: null,
        stripe_price_id: null,
        updated_at: "2026-01-01T00:00:00Z",
      },
    ];
    getPublicPricing.mockResolvedValue(tiersWithAddon);
    setupAuthenticated({ membershipRank: 0, hasParentSeat: false });
    render(await PricingPage());
    const buttons = screen.getAllByTestId("buy-now-button");
    // Last button is for "explore" — should not get the upsell.
    expect(buttons[buttons.length - 1]).toHaveAttribute("data-has-upsell", "false");
    // First three (tier cards) should get the upsell.
    [0, 1, 2].forEach((i) =>
      expect(buttons[i]).toHaveAttribute("data-has-upsell", "true")
    );
  });
});
