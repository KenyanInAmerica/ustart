import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SignOutButton } from "@/components/dashboard/SignOutButton";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({ push: mockPush })),
}));

// Mock the server action — factory must be self-contained (jest hoisting rule).
jest.mock("../../../lib/actions/signOut", () => ({
  signOut: jest.fn(),
}));

// Grab a typed reference after the mock is registered.
import { signOut } from "../../../lib/actions/signOut";
const mockSignOut = signOut as jest.Mock;

describe("dashboard/SignOutButton", () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockSignOut.mockReset();
    mockSignOut.mockResolvedValue(undefined);
  });

  it("renders without error", () => {
    const { container } = render(<SignOutButton />);
    expect(container).toBeTruthy();
  });

  it("renders a button with sign-out label", () => {
    render(<SignOutButton />);
    expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument();
  });

  it("calls signOut and navigates to / on click", async () => {
    render(<SignOutButton />);
    fireEvent.click(screen.getByRole("button", { name: /sign out/i }));

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });
});
