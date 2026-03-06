import { render, screen } from "@testing-library/react";
import { ContentCards } from "@/components/dashboard/ContentCards";
import type { DashboardAccess } from "@/types";

const noAccess: DashboardAccess = {
  membershipRank: 0,
  membershipTier: null,
  hasMembership: false,
  hasParentSeat: false,
  hasExplore: false,
  hasConcierge: false,
  hasAgreedToCommunity: false,
  hasAccessedContent: false,
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
};

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));

describe("ContentCards", () => {
  it("renders without error", () => {
    const { container } = render(<ContentCards access={noAccess} />);
    expect(container).toBeTruthy();
  });

  it("renders all six card labels", () => {
    render(<ContentCards access={noAccess} />);
    expect(screen.getByText("UStart Lite")).toBeInTheDocument();
    expect(screen.getByText("UStart Pro")).toBeInTheDocument();
    expect(screen.getByText("UStart Premium")).toBeInTheDocument();
    expect(screen.getByText("Parent Pack")).toBeInTheDocument();
    expect(screen.getByText("Explore")).toBeInTheDocument();
    expect(screen.getByText("Concierge")).toBeInTheDocument();
  });

  it("renders all cards locked when membershipRank is 0 and no addons", () => {
    render(<ContentCards access={noAccess} />);
    // No card should be a link to a content page — only /pricing links exist
    expect(screen.queryByRole("link", { name: /ustart lite/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /ustart pro/i })).not.toBeInTheDocument();
  });

  it("renders Lite as a link when membershipRank is 1", () => {
    render(<ContentCards access={{ ...noAccess, membershipRank: 1 }} />);
    expect(screen.getByRole("link", { name: /ustart lite/i })).toHaveAttribute("href", "/dashboard/lite");
    expect(screen.queryByRole("link", { name: /ustart pro/i })).not.toBeInTheDocument();
  });

  it("renders Lite and Pro as links when membershipRank is 2", () => {
    render(<ContentCards access={{ ...noAccess, membershipRank: 2 }} />);
    expect(screen.getByRole("link", { name: /ustart lite/i })).toHaveAttribute("href", "/dashboard/lite");
    expect(screen.getByRole("link", { name: /ustart pro/i })).toHaveAttribute("href", "/dashboard/pro");
    expect(screen.queryByRole("link", { name: /ustart premium/i })).not.toBeInTheDocument();
  });

  it("renders all tier cards as links when membershipRank is 3", () => {
    render(<ContentCards access={{ ...noAccess, membershipRank: 3 }} />);
    expect(screen.getByRole("link", { name: /ustart lite/i })).toHaveAttribute("href", "/dashboard/lite");
    expect(screen.getByRole("link", { name: /ustart pro/i })).toHaveAttribute("href", "/dashboard/pro");
    expect(screen.getByRole("link", { name: /ustart premium/i })).toHaveAttribute("href", "/dashboard/premium");
  });

  it("renders Parent Pack as a link when hasParentSeat is true", () => {
    render(<ContentCards access={{ ...noAccess, hasParentSeat: true }} />);
    expect(screen.getByRole("link", { name: /parent pack/i })).toHaveAttribute("href", "/dashboard/parent-pack");
  });

  it("renders Explore as a link when hasExplore is true", () => {
    render(<ContentCards access={{ ...noAccess, hasExplore: true }} />);
    expect(screen.getByRole("link", { name: /explore/i })).toHaveAttribute("href", "/dashboard/explore");
  });

  it("renders Concierge as a link when hasConcierge is true", () => {
    render(<ContentCards access={{ ...noAccess, hasConcierge: true }} />);
    expect(screen.getByRole("link", { name: /concierge/i })).toHaveAttribute("href", "/dashboard/concierge");
  });

  it("renders /pricing CTAs for all locked cards", () => {
    render(<ContentCards access={noAccess} />);
    // All 6 cards are locked for a user with no access — each shows "View plans →"
    const pricingLinks = screen.getAllByRole("link", { name: /view plans/i });
    expect(pricingLinks.length).toBe(6);
    pricingLinks.forEach((link) => expect(link).toHaveAttribute("href", "/pricing"));
  });

  it("renders all cards as links with full access", () => {
    render(<ContentCards access={fullAccess} />);
    expect(screen.getByRole("link", { name: /ustart lite/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ustart pro/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ustart premium/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /parent pack/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /explore/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /concierge/i })).toBeInTheDocument();
  });
});
