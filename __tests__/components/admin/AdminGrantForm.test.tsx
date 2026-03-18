import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AdminGrantForm } from "@/components/admin/AdminGrantForm";

const mockGrantAdminAccess = jest.fn();

jest.mock("../../../lib/actions/admin/admins", () => ({
  grantAdminAccess: (...args: unknown[]) => mockGrantAdminAccess(...args),
  revokeAdminAccess: jest.fn(),
}));

describe("AdminGrantForm", () => {
  beforeEach(() => {
    mockGrantAdminAccess.mockReset();
  });

  it("renders without error", () => {
    const { container } = render(<AdminGrantForm />);
    expect(container).toBeTruthy();
  });

  it("renders an email input", () => {
    render(<AdminGrantForm />);
    expect(screen.getByPlaceholderText(/user@example/i)).toBeInTheDocument();
  });

  it("renders the grant access button", () => {
    render(<AdminGrantForm />);
    expect(screen.getByRole("button", { name: /grant access/i })).toBeInTheDocument();
  });

  it("shows success message and clears input on success", async () => {
    mockGrantAdminAccess.mockResolvedValue({ success: true });
    render(<AdminGrantForm />);

    const input = screen.getByPlaceholderText(/user@example/i);
    fireEvent.change(input, { target: { value: "admin@example.com" } });
    fireEvent.submit(screen.getByRole("button", { name: /grant access/i }).closest("form")!);

    await waitFor(() => {
      expect(screen.getByText(/admin access granted/i)).toBeInTheDocument();
    });
  });

  it("shows error message on failure", async () => {
    mockGrantAdminAccess.mockResolvedValue({ success: false, error: "No account found for that email address." });
    render(<AdminGrantForm />);

    const input = screen.getByPlaceholderText(/user@example/i);
    fireEvent.change(input, { target: { value: "unknown@example.com" } });
    fireEvent.submit(screen.getByRole("button", { name: /grant access/i }).closest("form")!);

    await waitFor(() => {
      expect(screen.getByText("No account found for that email address.")).toBeInTheDocument();
    });
  });
});
