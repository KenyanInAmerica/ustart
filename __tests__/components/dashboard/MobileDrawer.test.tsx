import { render, screen, fireEvent } from "@testing-library/react";
import { MobileDrawer } from "@/components/dashboard/MobileDrawer";

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
  userEmail: "student@example.com",
  userInitials: "SE",
  planName: "UStart Lite",
};

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(() => "/dashboard"),
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));

jest.mock("@supabase/ssr", () => ({
  createBrowserClient: jest.fn(() => ({
    auth: { signOut: jest.fn().mockResolvedValue({}) },
  })),
}));

describe("MobileDrawer", () => {
  it("renders when isOpen is true", () => {
    const { container } = render(<MobileDrawer {...defaultProps} />);
    expect(container).toBeTruthy();
    expect(screen.getByText("UStart")).toBeInTheDocument();
  });

  it("renders nothing when isOpen is false", () => {
    const { container } = render(
      <MobileDrawer {...defaultProps} isOpen={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders all nav items", () => {
    render(<MobileDrawer {...defaultProps} />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    // "UStart Lite" and "Community" each appear as both section/nav label and footer text
    expect(screen.getAllByText("UStart Lite").length).toBeGreaterThan(0);
    expect(screen.getByText("Parent Pack")).toBeInTheDocument();
    expect(screen.getAllByText("Community").length).toBeGreaterThan(0);
    expect(screen.getByText("Account & Billing")).toBeInTheDocument();
  });

  it("renders Locked badges for locked items", () => {
    render(<MobileDrawer {...defaultProps} />);
    expect(screen.getAllByText("Locked").length).toBeGreaterThan(0);
  });

  it("calls onClose when the overlay backdrop is clicked", () => {
    const onClose = jest.fn();
    render(<MobileDrawer {...defaultProps} onClose={onClose} />);
    // The backdrop is the first div with aria-hidden
    const backdrop = document.querySelector('[aria-hidden="true"]') as HTMLElement;
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the close button is clicked", () => {
    const onClose = jest.fn();
    render(<MobileDrawer {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /close navigation/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders the user email and initials", () => {
    render(<MobileDrawer {...defaultProps} />);
    expect(screen.getByText("student@example.com")).toBeInTheDocument();
    expect(screen.getByText("SE")).toBeInTheDocument();
  });
});
