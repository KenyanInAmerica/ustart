import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { UserPanel } from "@/components/admin/UserPanel";
import type { AdminUser } from "@/types/admin";

jest.mock("../../../lib/actions/admin/users", () => ({
  setUserMembershipTier: jest.fn(),
  setUserAddon: jest.fn(),
}));

import {
  setUserMembershipTier,
  setUserAddon,
} from "../../../lib/actions/admin/users";

const mockUser: AdminUser = {
  id: "user-1",
  email: "student@test.com",
  first_name: "Alice",
  last_name: "Smith",
  university_name: "MIT",
  membership_tier: "lite",
  membership_purchased_at: null,
  has_explore: false,
  has_concierge: false,
  has_parent_seat: false,
  is_admin: false,
  is_active: true,
};

beforeEach(() => {
  jest.clearAllMocks();
  (setUserMembershipTier as jest.Mock).mockResolvedValue({ success: true });
  (setUserAddon as jest.Mock).mockResolvedValue({ success: true });
});

describe("UserPanel", () => {
  it("renders without error", () => {
    const { container } = render(
      <UserPanel user={mockUser} onClose={jest.fn()} />
    );
    expect(container).toBeTruthy();
  });

  it("shows only Parent Pack as a toggle and leaves calls read-only", () => {
    render(<UserPanel user={mockUser} onClose={jest.fn()} />);

    expect(screen.getAllByRole("switch")).toHaveLength(1);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
    expect(screen.getByText("Parent Pack")).toBeInTheDocument();
    expect(screen.getByText("1:1 Arrival Call")).toBeInTheDocument();
    expect(screen.getByText("Additional Support Call")).toBeInTheDocument();
    expect(screen.getAllByText("Read only")).toHaveLength(2);
  });

  it("displays the user email", () => {
    render(<UserPanel user={mockUser} onClose={jest.fn()} />);
    expect(screen.getByText("student@test.com")).toBeInTheDocument();
  });

  it("renders null without crashing", () => {
    const { container } = render(
      <UserPanel user={null} onClose={jest.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("Save button is disabled when no changes are staged", () => {
    render(<UserPanel user={mockUser} onClose={jest.fn()} />);
    expect(screen.getByRole("button", { name: /save changes/i })).toBeDisabled();
  });

  it("Save button enables after staging a tier change", () => {
    render(<UserPanel user={mockUser} onClose={jest.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /explore/i }));
    expect(
      screen.getByRole("button", { name: /save changes/i })
    ).not.toBeDisabled();
  });

  it("calls setUserMembershipTier when tier is changed and saved", async () => {
    render(<UserPanel user={mockUser} onClose={jest.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /explore/i }));
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    await waitFor(() =>
      expect(setUserMembershipTier).toHaveBeenCalledWith("user-1", "explore")
    );
  });

  it("shows success message after save and auto-dismisses after 3 seconds", async () => {
    jest.useFakeTimers();
    render(<UserPanel user={mockUser} onClose={jest.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /explore/i }));
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    await waitFor(() =>
      expect(
        screen.getByText(/changes saved successfully/i)
      ).toBeInTheDocument()
    );
    act(() => { jest.advanceTimersByTime(3000); });
    expect(
      screen.queryByText(/changes saved successfully/i)
    ).not.toBeInTheDocument();
    jest.useRealTimers();
  });

  it("calls onClose when the close button is clicked", () => {
    const onClose = jest.fn();
    render(<UserPanel user={mockUser} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /close panel/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
