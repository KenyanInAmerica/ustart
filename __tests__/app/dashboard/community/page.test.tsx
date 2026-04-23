import { render, screen } from "@testing-library/react";
import DashboardCommunityPage from "@/app/dashboard/community/page";

const mockGetUser = jest.fn();
const mockMaybeSingle = jest.fn();

jest.mock("../../../../lib/supabase/server", () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          maybeSingle: mockMaybeSingle,
        })),
      })),
    })),
  })),
}));

jest.mock("../../../../components/dashboard/CommunitySectionWrapper", () => ({
  CommunitySectionWrapper: () => <div data-testid="community-section-stub" />,
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

import { redirect } from "next/navigation";

describe("DashboardCommunityPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "student@example.com" } },
    });
    mockMaybeSingle.mockResolvedValue({
      data: { role: "student" },
    });
  });

  it("renders the page heading and content", async () => {
    render(await DashboardCommunityPage());

    expect(screen.getByRole("heading", { name: /community/i })).toBeInTheDocument();
    expect(screen.getByTestId("community-section-stub")).toBeInTheDocument();
  });

  it("redirects parent users to the parent plan", async () => {
    mockMaybeSingle.mockResolvedValue({ data: { role: "parent" } });

    await DashboardCommunityPage();

    expect(redirect).toHaveBeenCalledWith("/dashboard/parent/plan");
  });
});
