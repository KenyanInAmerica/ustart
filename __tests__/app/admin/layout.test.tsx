import { render, screen } from "@testing-library/react";
import AdminLayout from "@/app/admin/layout";

jest.mock("../../../lib/admin/data", () => ({
  fetchPendingDocumentSubmissionCount: jest.fn().mockResolvedValue(4),
}));

jest.mock("../../../components/admin/AdminSidebar", () => ({
  AdminSidebar: ({ pendingDocumentCount }: { pendingDocumentCount: number }) => (
    <aside data-testid="admin-sidebar">{pendingDocumentCount}</aside>
  ),
}));

describe("AdminLayout", () => {
  it("renders children and passes pending document count to sidebar", async () => {
    render(await AdminLayout({ children: <div>Admin child</div> }));

    expect(screen.getByText("Admin child")).toBeInTheDocument();
    expect(screen.getByTestId("admin-sidebar")).toHaveTextContent("4");
  });
});
