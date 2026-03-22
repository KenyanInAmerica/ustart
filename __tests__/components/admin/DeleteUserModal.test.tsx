import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DeleteUserModal } from "@/components/admin/DeleteUserModal";
import type { AdminUser } from "@/types/admin";

const mockSoftDeleteUser = jest.fn();
const mockHardDeleteUser = jest.fn();

jest.mock("../../../lib/actions/admin/users", () => ({
  softDeleteUser: (...args: unknown[]) => mockSoftDeleteUser(...args),
  hardDeleteUser: (...args: unknown[]) => mockHardDeleteUser(...args),
  setUserMembershipTier: jest.fn(),
  setUserAddon: jest.fn(),
}));

const mockUser: AdminUser = {
  id: "user-1",
  email: "student@test.com",
  first_name: "Alice",
  last_name: "Smith",
  university_name: "MIT",
  membership_tier: "pro",
  membership_purchased_at: null,
  has_explore: false,
  has_concierge: false,
  has_parent_seat: false,
  is_admin: false,
  is_active: true,
};

const inactiveUser: AdminUser = { ...mockUser, is_active: false };

const mockOnClose = jest.fn();
const mockOnDeleted = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
});

describe("DeleteUserModal", () => {
  it("renders without error", () => {
    const { container } = render(
      <DeleteUserModal user={mockUser} onClose={mockOnClose} onDeleted={mockOnDeleted} />
    );
    expect(container).toBeTruthy();
  });

  it("displays the user name and email", () => {
    render(
      <DeleteUserModal user={mockUser} onClose={mockOnClose} onDeleted={mockOnDeleted} />
    );
    // Name appears in the user summary card and in the checkbox label
    expect(screen.getAllByText(/alice smith/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText("student@test.com").length).toBeGreaterThan(0);
  });

  it("Deactivate Account button is disabled before checkbox is ticked", () => {
    render(
      <DeleteUserModal user={mockUser} onClose={mockOnClose} onDeleted={mockOnDeleted} />
    );
    expect(
      screen.getByRole("button", { name: /deactivate account/i })
    ).toBeDisabled();
  });

  it("Deactivate Account button enables after ticking the checkbox", () => {
    render(
      <DeleteUserModal user={mockUser} onClose={mockOnClose} onDeleted={mockOnDeleted} />
    );
    const checkbox = screen.getAllByRole("checkbox")[0];
    fireEvent.click(checkbox);
    expect(
      screen.getByRole("button", { name: /deactivate account/i })
    ).not.toBeDisabled();
  });

  it("calls softDeleteUser and onDeleted on confirm", async () => {
    mockSoftDeleteUser.mockResolvedValue({ success: true });
    render(
      <DeleteUserModal user={mockUser} onClose={mockOnClose} onDeleted={mockOnDeleted} />
    );
    fireEvent.click(screen.getAllByRole("checkbox")[0]);
    fireEvent.click(screen.getByRole("button", { name: /deactivate account/i }));
    await waitFor(() =>
      expect(mockSoftDeleteUser).toHaveBeenCalledWith("user-1")
    );
    expect(mockOnDeleted).toHaveBeenCalledTimes(1);
  });

  it("shows error when softDeleteUser returns failure", async () => {
    mockSoftDeleteUser.mockResolvedValue({ success: false, error: "DB error" });
    render(
      <DeleteUserModal user={mockUser} onClose={mockOnClose} onDeleted={mockOnDeleted} />
    );
    fireEvent.click(screen.getAllByRole("checkbox")[0]);
    fireEvent.click(screen.getByRole("button", { name: /deactivate account/i }));
    await waitFor(() =>
      expect(screen.getByText("DB error")).toBeInTheDocument()
    );
    expect(mockOnDeleted).not.toHaveBeenCalled();
  });

  it("shows 'Permanent erasure' link", () => {
    render(
      <DeleteUserModal user={mockUser} onClose={mockOnClose} onDeleted={mockOnDeleted} />
    );
    expect(
      screen.getByRole("button", { name: /permanent erasure/i })
    ).toBeInTheDocument();
  });

  it("expands hard delete section on click of Permanent erasure link", () => {
    render(
      <DeleteUserModal user={mockUser} onClose={mockOnClose} onDeleted={mockOnDeleted} />
    );
    fireEvent.click(screen.getByRole("button", { name: /permanent erasure/i }));
    expect(
      screen.getByRole("button", { name: /delete permanently/i })
    ).toBeInTheDocument();
  });

  it("Delete Permanently button is disabled until both checkboxes are ticked", () => {
    render(
      <DeleteUserModal user={mockUser} onClose={mockOnClose} onDeleted={mockOnDeleted} />
    );
    fireEvent.click(screen.getByRole("button", { name: /permanent erasure/i }));
    // Tick only the second (hard) checkbox — first not ticked.
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[1]);
    expect(
      screen.getByRole("button", { name: /delete permanently/i })
    ).toBeDisabled();
  });

  it("calls hardDeleteUser when both checkboxes are ticked and button clicked", async () => {
    mockHardDeleteUser.mockResolvedValue({ success: true });
    render(
      <DeleteUserModal user={mockUser} onClose={mockOnClose} onDeleted={mockOnDeleted} />
    );
    fireEvent.click(screen.getByRole("button", { name: /permanent erasure/i }));
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]);
    fireEvent.click(checkboxes[1]);
    fireEvent.click(screen.getByRole("button", { name: /delete permanently/i }));
    await waitFor(() =>
      expect(mockHardDeleteUser).toHaveBeenCalledWith("user-1")
    );
    expect(mockOnDeleted).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the close button is clicked", () => {
    render(
      <DeleteUserModal user={mockUser} onClose={mockOnClose} onDeleted={mockOnDeleted} />
    );
    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  describe("already-inactive user path", () => {
    it("shows the already-deactivated notice", () => {
      render(
        <DeleteUserModal user={inactiveUser} onClose={mockOnClose} onDeleted={mockOnDeleted} />
      );
      expect(screen.getByText(/already deactivated/i)).toBeInTheDocument();
    });

    it("does not show the Deactivate Account button for inactive users", () => {
      render(
        <DeleteUserModal user={inactiveUser} onClose={mockOnClose} onDeleted={mockOnDeleted} />
      );
      expect(screen.queryByRole("button", { name: /deactivate account/i })).not.toBeInTheDocument();
    });

    it("shows Delete Permanently directly without needing to expand", () => {
      render(
        <DeleteUserModal user={inactiveUser} onClose={mockOnClose} onDeleted={mockOnDeleted} />
      );
      expect(screen.getByRole("button", { name: /delete permanently/i })).toBeInTheDocument();
    });

    it("Delete Permanently is disabled until the erasure checkbox is ticked", () => {
      render(
        <DeleteUserModal user={inactiveUser} onClose={mockOnClose} onDeleted={mockOnDeleted} />
      );
      expect(screen.getByRole("button", { name: /delete permanently/i })).toBeDisabled();
      fireEvent.click(screen.getByRole("checkbox"));
      expect(screen.getByRole("button", { name: /delete permanently/i })).not.toBeDisabled();
    });

    it("calls hardDeleteUser (not softDeleteUser) for inactive users", async () => {
      mockHardDeleteUser.mockResolvedValue({ success: true });
      render(
        <DeleteUserModal user={inactiveUser} onClose={mockOnClose} onDeleted={mockOnDeleted} />
      );
      fireEvent.click(screen.getByRole("checkbox"));
      fireEvent.click(screen.getByRole("button", { name: /delete permanently/i }));
      await waitFor(() => expect(mockHardDeleteUser).toHaveBeenCalledWith("user-1"));
      expect(mockSoftDeleteUser).not.toHaveBeenCalled();
      expect(mockOnDeleted).toHaveBeenCalledTimes(1);
    });
  });
});
