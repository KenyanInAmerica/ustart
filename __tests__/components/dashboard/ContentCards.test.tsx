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
  phoneNumber: null,
  membershipPurchasedAt: null,
  role: "student",
  invitedParentEmail: null,
  parentInvitationStatus: null,
  parentInvitationAcceptedAt: null,
  parentShareTasks: true,
  parentShareCalendar: true,
  parentShareContent: true,
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
  parentShareTasks: true,
  parentShareCalendar: true,
  parentShareContent: true,
};

describe("ContentCards", () => {
  it("renders without error", () => {
    const { container } = render(<ContentCards access={noAccess} />);
    expect(container).toBeTruthy();
  });

  it("renders the renamed membership cards plus Parent Pack", () => {
    render(<ContentCards access={noAccess} />);
    expect(screen.getByText("UStart Lite")).toBeInTheDocument();
    expect(screen.getByText("UStart Explore")).toBeInTheDocument();
    expect(screen.getByText("UStart Concierge")).toBeInTheDocument();
    expect(screen.getByText("Parent Pack")).toBeInTheDocument();
  });

  it("renders locked tier cards as /pricing links when no access", () => {
    render(<ContentCards access={noAccess} />);
    // Locked tier cards are full links to /pricing — the accessible name comes from the card title.
    const liteLink = screen.getByRole("link", { name: /ustart lite/i });
    expect(liteLink).toHaveAttribute("href", "/pricing");
    const exploreLink = screen.getByRole("link", { name: /ustart explore/i });
    expect(exploreLink).toHaveAttribute("href", "/pricing");
  });

  it("renders locked Parent Pack as a /pricing link", () => {
    render(<ContentCards access={noAccess} />);
    expect(screen.getByRole("link", { name: /parent pack/i })).toHaveAttribute(
      "href",
      "/pricing"
    );
  });

  it("renders Lite as a dashboard link when membershipRank is 1", () => {
    render(<ContentCards access={{ ...noAccess, membershipRank: 1 }} />);
    expect(screen.getByRole("link", { name: /ustart lite/i })).toHaveAttribute(
      "href",
      "/dashboard/content/lite"
    );
  });

  it("renders Explore as a dashboard link when membershipRank is 2", () => {
    render(<ContentCards access={{ ...noAccess, membershipRank: 2 }} />);
    expect(screen.getByRole("link", { name: /ustart explore/i })).toHaveAttribute(
      "href",
      "/dashboard/content/explore"
    );
  });

  it("renders all tier cards as dashboard links when membershipRank is 3", () => {
    render(<ContentCards access={{ ...noAccess, membershipRank: 3 }} />);
    expect(screen.getByRole("link", { name: /ustart lite/i })).toHaveAttribute("href", "/dashboard/content/lite");
    expect(screen.getByRole("link", { name: /ustart explore/i })).toHaveAttribute("href", "/dashboard/content/explore");
    expect(screen.getByRole("link", { name: /ustart concierge/i })).toHaveAttribute("href", "/dashboard/content/concierge");
  });

  it("renders Parent Pack as a link when hasParentSeat is true", () => {
    render(<ContentCards access={{ ...noAccess, hasParentSeat: true }} />);
    expect(screen.getByRole("link", { name: /parent pack/i })).toHaveAttribute(
      "href",
      "/dashboard/content/parent-pack"
    );
  });

  it("renders all cards as links with full access", () => {
    render(<ContentCards access={fullAccess} />);
    expect(screen.getByRole("link", { name: /ustart lite/i })).toHaveAttribute("href", "/dashboard/content/lite");
    expect(screen.getByRole("link", { name: /ustart explore/i })).toHaveAttribute("href", "/dashboard/content/explore");
    expect(screen.getByRole("link", { name: /ustart concierge/i })).toHaveAttribute("href", "/dashboard/content/concierge");
    expect(screen.getByRole("link", { name: /parent pack/i })).toHaveAttribute("href", "/dashboard/content/parent-pack");
  });

  it("supports parent content routes without rendering Parent Pack", () => {
    render(
      <ContentCards
        access={{ ...noAccess, membershipRank: 2, role: "parent" }}
        hrefOverrides={{
          lite: "/dashboard/parent/content/lite",
          explore: "/dashboard/parent/content/explore",
          concierge: "/dashboard/parent/content/concierge",
        }}
        includeParentPack={false}
        lockedHref={null}
      />
    );

    expect(screen.getByRole("link", { name: /ustart lite/i })).toHaveAttribute(
      "href",
      "/dashboard/parent/content/lite"
    );
    expect(screen.getByRole("link", { name: /ustart explore/i })).toHaveAttribute(
      "href",
      "/dashboard/parent/content/explore"
    );
    expect(
      screen.queryByRole("link", { name: /ustart concierge/i })
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Parent Pack")).not.toBeInTheDocument();
  });
});
