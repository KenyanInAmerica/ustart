import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SignOutButton } from "@/components/ui/SignOutButton";

const mockRefresh = jest.fn();
const mockSignOut = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({ refresh: mockRefresh })),
}));

jest.mock("@supabase/ssr", () => ({
  createBrowserClient: jest.fn(() => ({
    auth: { signOut: mockSignOut },
  })),
}));

describe("SignOutButton", () => {
  beforeEach(() => {
    mockRefresh.mockReset();
    mockSignOut.mockReset();
    mockSignOut.mockResolvedValue({});
  });

  it("renders without error", () => {
    const { container } = render(<SignOutButton />);
    expect(container).toBeTruthy();
  });

  it("renders a button with sign-out label", () => {
    render(<SignOutButton />);
    expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument();
  });

  it("calls signOut then router.refresh on click", async () => {
    render(<SignOutButton />);
    fireEvent.click(screen.getByRole("button", { name: /sign out/i }));

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledTimes(1);
      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });
  });
});
