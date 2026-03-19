import { render, screen, fireEvent } from "@testing-library/react";
import { ContentCards } from "@/components/dashboard/ContentCards";
import type { DashboardAccess } from "@/types";
import type { PricingItem, AddonId } from "@/lib/config/pricing";

// Mock AddonModal so we can test it opens without rendering its internals.
// Use relative path — jest.mock() doesn't always resolve @/ path aliases.
jest.mock("../../../components/dashboard/AddonModal", () => ({
  AddonModal: ({ item, onClose }: { item: PricingItem; onClose: () => void }) => (
    <div data-testid="addon-modal" data-item-name={item.name}>
      <button onClick={onClose}>close modal</button>
    </div>
  ),
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));

const noAccess: DashboardAccess = {
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

const fullAccess: DashboardAccess = {
  membershipRank: 3,
  membershipTier: "premium",
  hasMembership: true,
  hasParentSeat: true,
  hasExplore: true,
  hasConcierge: true,
  hasAgreedToCommunity: true,
  hasAccessedContent: true,
  phoneNumber: null,
  membershipPurchasedAt: null,
  role: "student",
  invitedParentEmail: null,
  parentInvitationStatus: null,
  parentInvitationAcceptedAt: null,
};

const mockAddonPricing: Partial<Record<AddonId, PricingItem>> = {
  parent_pack: {
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
  explore: {
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
  concierge: {
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
};

describe("ContentCards", () => {
  it("renders without error", () => {
    const { container } = render(
      <ContentCards access={noAccess} addonPricing={{}} />
    );
    expect(container).toBeTruthy();
  });

  it("renders all six card labels", () => {
    render(<ContentCards access={noAccess} addonPricing={{}} />);
    expect(screen.getByText("UStart Lite")).toBeInTheDocument();
    expect(screen.getByText("UStart Pro")).toBeInTheDocument();
    expect(screen.getByText("UStart Premium")).toBeInTheDocument();
    expect(screen.getByText("Parent Pack")).toBeInTheDocument();
    expect(screen.getByText("Explore")).toBeInTheDocument();
    expect(screen.getByText("Concierge")).toBeInTheDocument();
  });

  it("renders locked tier cards as /pricing links when no access", () => {
    render(<ContentCards access={noAccess} addonPricing={{}} />);
    // Locked tier cards are full links to /pricing — the accessible name comes from the card title.
    const liteLink = screen.getByRole("link", { name: /ustart lite/i });
    expect(liteLink).toHaveAttribute("href", "/pricing");
    const proLink = screen.getByRole("link", { name: /ustart pro/i });
    expect(proLink).toHaveAttribute("href", "/pricing");
  });

  it("renders locked add-on cards as buttons (not links)", () => {
    render(<ContentCards access={noAccess} addonPricing={mockAddonPricing} />);
    // Locked add-on cards are buttons that open a purchase modal.
    expect(screen.getByRole("button", { name: /parent pack/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /explore/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /concierge/i })).toBeInTheDocument();
  });

  it("opens the AddonModal when a locked add-on card is clicked", () => {
    render(<ContentCards access={noAccess} addonPricing={mockAddonPricing} />);
    fireEvent.click(screen.getByRole("button", { name: /explore/i }));
    expect(screen.getByTestId("addon-modal")).toBeInTheDocument();
    expect(screen.getByTestId("addon-modal")).toHaveAttribute(
      "data-item-name",
      "Explore"
    );
  });

  it("closes the AddonModal when onClose is called", () => {
    render(<ContentCards access={noAccess} addonPricing={mockAddonPricing} />);
    fireEvent.click(screen.getByRole("button", { name: /explore/i }));
    expect(screen.getByTestId("addon-modal")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /close modal/i }));
    expect(screen.queryByTestId("addon-modal")).not.toBeInTheDocument();
  });

  it("does not open modal when add-on pricing is not provided for that id", () => {
    render(<ContentCards access={noAccess} addonPricing={{}} />);
    fireEvent.click(screen.getByRole("button", { name: /explore/i }));
    // No pricing data for explore — modal should not render.
    expect(screen.queryByTestId("addon-modal")).not.toBeInTheDocument();
  });

  it("renders Lite as a dashboard link when membershipRank is 1", () => {
    render(<ContentCards access={{ ...noAccess, membershipRank: 1 }} addonPricing={{}} />);
    expect(screen.getByRole("link", { name: /ustart lite/i })).toHaveAttribute(
      "href",
      "/dashboard/lite"
    );
  });

  it("renders Pro as a dashboard link when membershipRank is 2", () => {
    render(<ContentCards access={{ ...noAccess, membershipRank: 2 }} addonPricing={{}} />);
    expect(screen.getByRole("link", { name: /ustart pro/i })).toHaveAttribute(
      "href",
      "/dashboard/pro"
    );
  });

  it("renders all tier cards as dashboard links when membershipRank is 3", () => {
    render(<ContentCards access={{ ...noAccess, membershipRank: 3 }} addonPricing={{}} />);
    expect(screen.getByRole("link", { name: /ustart lite/i })).toHaveAttribute("href", "/dashboard/lite");
    expect(screen.getByRole("link", { name: /ustart pro/i })).toHaveAttribute("href", "/dashboard/pro");
    expect(screen.getByRole("link", { name: /ustart premium/i })).toHaveAttribute("href", "/dashboard/premium");
  });

  it("renders Parent Pack as a link when hasParentSeat is true", () => {
    render(<ContentCards access={{ ...noAccess, hasParentSeat: true }} addonPricing={{}} />);
    expect(screen.getByRole("link", { name: /parent pack/i })).toHaveAttribute(
      "href",
      "/dashboard/parent-pack"
    );
  });

  it("renders Explore as a link when hasExplore is true", () => {
    render(<ContentCards access={{ ...noAccess, hasExplore: true }} addonPricing={{}} />);
    expect(screen.getByRole("link", { name: /explore/i })).toHaveAttribute(
      "href",
      "/dashboard/explore"
    );
  });

  it("renders Concierge as a link when hasConcierge is true", () => {
    render(<ContentCards access={{ ...noAccess, hasConcierge: true }} addonPricing={{}} />);
    expect(screen.getByRole("link", { name: /concierge/i })).toHaveAttribute(
      "href",
      "/dashboard/concierge"
    );
  });

  it("renders all cards as links with full access", () => {
    render(<ContentCards access={fullAccess} addonPricing={{}} />);
    expect(screen.getByRole("link", { name: /ustart lite/i })).toHaveAttribute("href", "/dashboard/lite");
    expect(screen.getByRole("link", { name: /ustart pro/i })).toHaveAttribute("href", "/dashboard/pro");
    expect(screen.getByRole("link", { name: /ustart premium/i })).toHaveAttribute("href", "/dashboard/premium");
    expect(screen.getByRole("link", { name: /parent pack/i })).toHaveAttribute("href", "/dashboard/parent-pack");
    expect(screen.getByRole("link", { name: /explore/i })).toHaveAttribute("href", "/dashboard/explore");
    expect(screen.getByRole("link", { name: /concierge/i })).toHaveAttribute("href", "/dashboard/concierge");
  });
});
