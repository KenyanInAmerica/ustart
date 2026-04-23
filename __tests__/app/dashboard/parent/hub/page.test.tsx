import { render, screen } from "@testing-library/react";
import ParentHubPage from "@/app/dashboard/parent/hub/page";

const mockGetUser = jest.fn();
const mockProfileMaybeSingle = jest.fn();

jest.mock("../../../../../lib/supabase/server", () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
  })),
}));

jest.mock("../../../../../lib/supabase/service", () => ({
  createServiceClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          maybeSingle: mockProfileMaybeSingle,
        })),
      })),
    })),
  })),
}));

jest.mock("../../../../../lib/dashboard/parentPack", () => ({
  fetchParentPackLinks: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

import { redirect } from "next/navigation";
import { fetchParentPackLinks } from "../../../../../lib/dashboard/parentPack";

describe("ParentHubPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: "parent-1", email: "parent@example.com" } },
    });
    mockProfileMaybeSingle.mockResolvedValue({ data: { role: "parent" } });
    (fetchParentPackLinks as jest.Mock).mockResolvedValue({
      parentPackNotionUrl: "https://notion.so/parent-pack",
      parentContentNotionUrl: "",
    });
  });

  it("renders the hub heading and included topics", async () => {
    render(await ParentHubPage());

    expect(screen.getByRole("heading", { name: /parent hub/i })).toBeInTheDocument();
    expect(screen.getByText("What's included")).toBeInTheDocument();
    expect(screen.getByText(/understanding the us education system/i)).toBeInTheDocument();
  });

  it("shows the resource button for a live URL", async () => {
    (fetchParentPackLinks as jest.Mock).mockResolvedValue({
      parentPackNotionUrl: "https://notion.so/parent-pack",
      parentContentNotionUrl: "https://notion.so/parent-hub",
    });

    render(await ParentHubPage());

    expect(screen.getByRole("link", { name: /open parent resources/i })).toHaveAttribute(
      "href",
      "https://notion.so/parent-hub"
    );
  });

  it("redirects non-parent users back to the dashboard", async () => {
    mockProfileMaybeSingle.mockResolvedValue({ data: { role: "student" } });

    await ParentHubPage();

    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });
});
