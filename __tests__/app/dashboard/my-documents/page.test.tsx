import { render, screen } from "@testing-library/react";
import MyDocumentsPage from "@/app/dashboard/my-documents/page";

jest.mock("../../../../lib/supabase/server", () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: "user-1", email: "test@example.com" } },
      }),
    },
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

describe("MyDocumentsPage", () => {
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
});
