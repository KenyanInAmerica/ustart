import { render, screen } from "@testing-library/react";
import DashboardContentPage from "@/app/dashboard/content/page";

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

jest.mock("../../../../components/dashboard/ContentCardsSection", () => ({
  ContentCardsSection: () => <div data-testid="content-cards-stub" />,
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

import { redirect } from "next/navigation";

describe("DashboardContentPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "student@example.com" } },
    });
    mockMaybeSingle.mockResolvedValue({
      data: { role: "student" },
    });
  });

  it("renders without error", async () => {
    const { container } = render(await DashboardContentPage());
    expect(container).toBeTruthy();
  });

  it("renders the page heading and subtitle", async () => {
    render(await DashboardContentPage());
    expect(screen.getByRole("heading", { name: /my content/i })).toBeInTheDocument();
    expect(screen.getByText("Access your UStart resources.")).toBeInTheDocument();
  });

  it("renders the content cards section", async () => {
    render(await DashboardContentPage());
    expect(screen.getByTestId("content-cards-stub")).toBeInTheDocument();
  });

  it("redirects parent users to parent content", async () => {
    mockMaybeSingle.mockResolvedValue({ data: { role: "parent" } });

    await DashboardContentPage();

    expect(redirect).toHaveBeenCalledWith("/dashboard/parent/content");
  });
});
