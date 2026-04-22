import { render, screen, fireEvent } from "@testing-library/react";
import { ContentCards } from "@/components/dashboard/ContentCards";
import type { DashboardAccess } from "@/types";
import type { PricingItem, ProductId } from "@/lib/config/pricing";

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
  membershipTier: "concierge",
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

const mockUpsellPricing: Partial<Record<ProductId, PricingItem>> = {
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
};

describe("ContentCards", () => {
  it("renders without error", () => {
    const { container } = render(
      <ContentCards access={noAccess} upsellPricing={{}} />
    );
    expect(container).toBeTruthy();
  });

  it("renders the renamed membership cards plus Parent Pack", () => {
    render(<ContentCards access={noAccess} upsellPricing={{}} />);
    expect(screen.getByText("UStart Lite")).toBeInTheDocument();
    expect(screen.getByText("UStart Explore")).toBeInTheDocument();
    expect(screen.getByText("UStart Concierge")).toBeInTheDocument();
    expect(screen.getByText("Parent Pack")).toBeInTheDocument();
  });

  it("renders locked tier cards as /pricing links when no access", () => {
    render(<ContentCards access={noAccess} upsellPricing={{}} />);
    // Locked tier cards are full links to /pricing — the accessible name comes from the card title.
    const liteLink = screen.getByRole("link", { name: /ustart lite/i });
    expect(liteLink).toHaveAttribute("href", "/pricing");
    const exploreLink = screen.getByRole("link", { name: /ustart explore/i });
    expect(exploreLink).toHaveAttribute("href", "/pricing");
  });

  it("renders locked Parent Pack as a button (not a link)", () => {
    render(<ContentCards access={noAccess} upsellPricing={mockUpsellPricing} />);
    expect(screen.getByRole("button", { name: /parent pack/i })).toBeInTheDocument();
  });

  it("opens the AddonModal when the locked Parent Pack card is clicked", () => {
    render(<ContentCards access={noAccess} upsellPricing={mockUpsellPricing} />);
    fireEvent.click(screen.getByRole("button", { name: /parent pack/i }));
    expect(screen.getByTestId("addon-modal")).toBeInTheDocument();
    expect(screen.getByTestId("addon-modal")).toHaveAttribute(
      "data-item-name",
      "Parent Pack"
    );
  });

  it("closes the AddonModal when onClose is called", () => {
    render(<ContentCards access={noAccess} upsellPricing={mockUpsellPricing} />);
    fireEvent.click(screen.getByRole("button", { name: /parent pack/i }));
    expect(screen.getByTestId("addon-modal")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /close modal/i }));
    expect(screen.queryByTestId("addon-modal")).not.toBeInTheDocument();
  });

  it("does not open modal when Parent Pack pricing is not provided", () => {
    render(<ContentCards access={noAccess} upsellPricing={{}} />);
    fireEvent.click(screen.getByRole("button", { name: /parent pack/i }));
    expect(screen.queryByTestId("addon-modal")).not.toBeInTheDocument();
  });

  it("renders Lite as a dashboard link when membershipRank is 1", () => {
    render(<ContentCards access={{ ...noAccess, membershipRank: 1 }} upsellPricing={{}} />);
    expect(screen.getByRole("link", { name: /ustart lite/i })).toHaveAttribute(
      "href",
      "/dashboard/content/lite"
    );
  });

  it("renders Explore as a dashboard link when membershipRank is 2", () => {
    render(<ContentCards access={{ ...noAccess, membershipRank: 2 }} upsellPricing={{}} />);
    expect(screen.getByRole("link", { name: /ustart explore/i })).toHaveAttribute(
      "href",
      "/dashboard/content/explore"
    );
  });

  it("renders all tier cards as dashboard links when membershipRank is 3", () => {
    render(<ContentCards access={{ ...noAccess, membershipRank: 3 }} upsellPricing={{}} />);
    expect(screen.getByRole("link", { name: /ustart lite/i })).toHaveAttribute("href", "/dashboard/content/lite");
    expect(screen.getByRole("link", { name: /ustart explore/i })).toHaveAttribute("href", "/dashboard/content/explore");
    expect(screen.getByRole("link", { name: /ustart concierge/i })).toHaveAttribute("href", "/dashboard/content/concierge");
  });

  it("renders Parent Pack as a link when hasParentSeat is true", () => {
    render(<ContentCards access={{ ...noAccess, hasParentSeat: true }} upsellPricing={{}} />);
    expect(screen.getByRole("link", { name: /parent pack/i })).toHaveAttribute(
      "href",
      "/dashboard/content/parent-pack"
    );
  });

  it("renders all cards as links with full access", () => {
    render(<ContentCards access={fullAccess} upsellPricing={{}} />);
    expect(screen.getByRole("link", { name: /ustart lite/i })).toHaveAttribute("href", "/dashboard/content/lite");
    expect(screen.getByRole("link", { name: /ustart explore/i })).toHaveAttribute("href", "/dashboard/content/explore");
    expect(screen.getByRole("link", { name: /ustart concierge/i })).toHaveAttribute("href", "/dashboard/content/concierge");
    expect(screen.getByRole("link", { name: /parent pack/i })).toHaveAttribute("href", "/dashboard/content/parent-pack");
  });
});
