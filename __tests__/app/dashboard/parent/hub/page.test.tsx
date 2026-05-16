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

jest.mock("../../../../../lib/notion/fetcher", () => ({
  getNotionBlocks: jest.fn().mockResolvedValue([]),
}));

jest.mock("../../../../../lib/notion/config", () => ({
  NOTION_PAGE_IDS: { parentPack: "", parentHub: "", lite: "", explore: "", concierge: "" },
}));

jest.mock("../../../../../components/notion/NotionPageShell", () => ({
  NotionPageShell: ({ title, children }: { title: string; children?: React.ReactNode }) => (
    <div data-testid="notion-page-shell-stub">
      <span data-testid="shell-title">{title}</span>
      {children}
    </div>
  ),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

import { redirect } from "next/navigation";
import { fetchParentPackLinks } from "../../../../../lib/dashboard/parentPack";

describe("ParentHubPage — fallback (no Notion page ID)", () => {
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

  it("renders without error", async () => {
    const { container } = render(await ParentHubPage());
    expect(container).toBeTruthy();
  });

  it("renders the hub heading and subtitle", async () => {
    render(await ParentHubPage());
    expect(screen.getByRole("heading", { name: /parent hub/i })).toBeInTheDocument();
    expect(screen.getByText(/exclusive resources for parents/i)).toBeInTheDocument();
  });

  it("renders the static 'What's included' section when no Notion page ID is configured", async () => {
    render(await ParentHubPage());
    expect(screen.getByText("What's included")).toBeInTheDocument();
    expect(screen.getByText(/understanding the us education system/i)).toBeInTheDocument();
  });

  it("does not render the Notion shell when no Notion page ID is configured", async () => {
    render(await ParentHubPage());
    expect(screen.queryByTestId("notion-page-shell-stub")).not.toBeInTheDocument();
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

  it("shows the coming-soon placeholder for a placeholder/empty URL", async () => {
    render(await ParentHubPage());
    expect(screen.getByText(/parent resources are coming soon/i)).toBeInTheDocument();
  });

  it("redirects non-parent users back to the dashboard", async () => {
    mockProfileMaybeSingle.mockResolvedValue({ data: { role: "student" } });
    await ParentHubPage();
    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });
});

describe("ParentHubPage — Notion path (NOTION_PARENT_HUB_PAGE_ID configured)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: "parent-1" } },
    });
    mockProfileMaybeSingle.mockResolvedValue({ data: { role: "parent" } });
    (fetchParentPackLinks as jest.Mock).mockResolvedValue({
      parentPackNotionUrl: "",
      parentContentNotionUrl: "",
    });

    // Override config mock to simulate a live page ID
    jest.doMock("../../../../../lib/notion/config", () => ({
      NOTION_PAGE_IDS: { parentHub: "hub-page-id-abc", parentPack: "", lite: "", explore: "", concierge: "" },
    }));
  });

  it("renders the NotionPageShell with the hub title when page ID is configured", async () => {
    jest.resetModules();
    jest.doMock("../../../../../lib/notion/config", () => ({
      NOTION_PAGE_IDS: { parentHub: "hub-page-id-abc", parentPack: "", lite: "", explore: "", concierge: "" },
    }));
    jest.doMock("../../../../../lib/notion/fetcher", () => ({
      getNotionBlocks: jest.fn().mockResolvedValue([]),
    }));
    jest.doMock("../../../../../components/notion/NotionPageShell", () => ({
      NotionPageShell: ({ title }: { title: string }) => (
        <div data-testid="notion-page-shell-stub">{title}</div>
      ),
    }));
    jest.doMock("../../../../../lib/supabase/server", () => ({
      createClient: jest.fn(() => ({ auth: { getUser: mockGetUser } })),
    }));
    jest.doMock("../../../../../lib/supabase/service", () => ({
      createServiceClient: jest.fn(() => ({
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({ maybeSingle: mockProfileMaybeSingle })),
          })),
        })),
      })),
    }));
    jest.doMock("../../../../../lib/dashboard/parentPack", () => ({
      fetchParentPackLinks: jest.fn().mockResolvedValue({ parentPackNotionUrl: "", parentContentNotionUrl: "" }),
    }));
    jest.doMock("next/navigation", () => ({ redirect: jest.fn() }));

    const { default: FreshPage } = await import("../../../../../app/dashboard/parent/hub/page");
    render(await FreshPage());

    expect(screen.getByTestId("notion-page-shell-stub")).toBeInTheDocument();
    expect(screen.getByTestId("notion-page-shell-stub")).toHaveTextContent("Parent Hub");
    expect(screen.queryByText("What's included")).not.toBeInTheDocument();
  });
});
