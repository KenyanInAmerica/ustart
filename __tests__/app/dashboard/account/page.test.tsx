import { render, screen } from "@testing-library/react";

const mockGetUser = jest.fn();
const mockProfileMaybeSingle = jest.fn();
const mockAccessMaybeSingle = jest.fn();

jest.mock("../../../../lib/supabase/server", () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
    from: jest.fn((table: string) => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          maybeSingle: table === "profiles" ? mockProfileMaybeSingle : mockAccessMaybeSingle,
        })),
        maybeSingle: table === "profiles" ? mockProfileMaybeSingle : mockAccessMaybeSingle,
      })),
    })),
  })),
}));

// ProfileSection and BillingSection are Client Components with interactive state,
// tested in their own files.
jest.mock("../../../../components/account/ProfileSection", () => ({
  ProfileSection: () => <div data-testid="profile-section-stub" />,
}));

jest.mock("../../../../components/account/BillingSection", () => ({
  BillingSection: () => <div data-testid="billing-section-stub" />,
}));

// getPricing uses React.cache which is not available in Jest — mock the module.
jest.mock("../../../../lib/config/getPricing", () => ({
  getPricing: jest.fn().mockResolvedValue([]),
  getPublicPricing: jest.fn().mockResolvedValue([]),
  getPricingById: jest.fn().mockResolvedValue(null),
}));

import AccountPage from "@/app/dashboard/account/page";

const mockUserData = {
  first_name: "Randy",
  last_name: "Osoti",
  email: "randy@example.com",
  phone_number: "+12025551234",
  university_name: "University of Michigan",
  country_of_origin: "Kenya",
  membership_tier: "explore",
  membership_purchased_at: "2026-01-12T00:00:00Z",
  active_addons: [],
  has_parent_seat: false,
};

describe("AccountPage (dashboard/account)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "randy@example.com" } },
    });
    mockProfileMaybeSingle.mockResolvedValue({ data: { role: "student" } });
    mockAccessMaybeSingle.mockResolvedValue({ data: mockUserData });
  });

  it("renders without error when authenticated", async () => {
    const { container } = render(await AccountPage());
    expect(container).toBeTruthy();
  });

  it("renders the Account heading", async () => {
    render(await AccountPage());
    expect(
      screen.getByRole("heading", { name: /^account$/i })
    ).toBeInTheDocument();
  });

  it("renders the ProfileSection component", async () => {
    render(await AccountPage());
    expect(screen.getByTestId("profile-section-stub")).toBeInTheDocument();
  });

  it("renders the BillingSection component", async () => {
    render(await AccountPage());
    expect(screen.getByTestId("billing-section-stub")).toBeInTheDocument();
  });

  it("hides billing for parent accounts", async () => {
    mockProfileMaybeSingle.mockResolvedValue({ data: { role: "parent" } });

    render(await AccountPage());

    expect(screen.getByTestId("profile-section-stub")).toBeInTheDocument();
    expect(screen.queryByTestId("billing-section-stub")).not.toBeInTheDocument();
  });
});
