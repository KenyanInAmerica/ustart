import { render, screen } from "@testing-library/react";
import MyDocumentsPage from "@/app/dashboard/my-documents/page";

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

jest.mock("../../../../lib/dashboard/content", () => ({
  fetchUserDocuments: jest.fn().mockResolvedValue([]),
}));

jest.mock("../../../../components/dashboard/ContentGrid", () => ({
  ContentGrid: () => <div data-testid="content-grid-stub" />,
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

import { redirect } from "next/navigation";

describe("MyDocumentsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "test@example.com" } },
    });
    mockMaybeSingle.mockResolvedValue({
      data: { role: "student" },
    });
  });

  it("renders without error", async () => {
    const { container } = render(await MyDocumentsPage());
    expect(container).toBeTruthy();
  });

  it("renders the My Documents heading", async () => {
    render(await MyDocumentsPage());
    expect(screen.getByRole("heading", { name: /my documents/i })).toBeInTheDocument();
  });

  it("renders the content grid", async () => {
    render(await MyDocumentsPage());
    expect(screen.getByTestId("content-grid-stub")).toBeInTheDocument();
  });

  it("redirects parents to the parent dashboard", async () => {
    mockMaybeSingle.mockResolvedValue({ data: { role: "parent" } });

    await MyDocumentsPage();

    expect(redirect).toHaveBeenCalledWith("/dashboard/parent/plan");
  });
});
