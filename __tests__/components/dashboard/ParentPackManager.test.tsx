import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ParentPackManager } from "@/components/dashboard/ParentPackManager";

const mockSendParentInvitation = jest.fn();
const mockResendParentInvitation = jest.fn();
const mockCancelParentInvitation = jest.fn();
const mockUnlinkParent = jest.fn();
const mockUpdateParentSharing = jest.fn();

jest.mock("../../../lib/actions/parentInvitation", () => ({
  sendParentInvitation: (...args: unknown[]) => mockSendParentInvitation(...args),
  resendParentInvitation: (...args: unknown[]) => mockResendParentInvitation(...args),
  cancelParentInvitation: (...args: unknown[]) => mockCancelParentInvitation(...args),
  unlinkParent: (...args: unknown[]) => mockUnlinkParent(...args),
  updateParentSharing: (...args: unknown[]) => mockUpdateParentSharing(...args),
}));

const defaultProps = {
  initialStatus: null as "pending" | "accepted" | null,
  initialParentEmail: null,
  initialPreferences: {
    share_tasks: true,
    share_calendar: true,
    share_content: true,
  },
  parentPackNotionUrl: "https://notion.so/parent-pack",
};

function openSettings() {
  const toggle = screen.getByRole("button", { name: /set up parent access|manage settings/i });
  fireEvent.click(toggle);
}

describe("ParentPackManager", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSendParentInvitation.mockResolvedValue({ success: true });
    mockResendParentInvitation.mockResolvedValue({ success: true });
    mockCancelParentInvitation.mockResolvedValue({ success: true });
    mockUnlinkParent.mockResolvedValue({ success: true });
    mockUpdateParentSharing.mockResolvedValue({ success: true });
  });

  it("renders the header and toggle button, toggles hidden by default", () => {
    render(<ParentPackManager {...defaultProps} />);

    expect(screen.getByText("Invite a Parent")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /set up parent access/i })
    ).toBeInTheDocument();
    expect(screen.queryByRole("switch", { name: "My Plan & Tasks" })).not.toBeInTheDocument();
  });

  it("renders sharing toggles on by default after expanding settings", () => {
    render(<ParentPackManager {...defaultProps} />);
    openSettings();

    expect(screen.getByRole("switch", { name: "My Plan & Tasks" })).toHaveAttribute(
      "aria-checked",
      "true"
    );
    expect(screen.getByRole("switch", { name: "My Calendar" })).toHaveAttribute(
      "aria-checked",
      "true"
    );
    expect(screen.getByRole("switch", { name: "My Content" })).toHaveAttribute(
      "aria-checked",
      "true"
    );
  });

  it("passes the current sharing preferences when sending an invitation", async () => {
    render(<ParentPackManager {...defaultProps} />);
    openSettings();

    fireEvent.click(screen.getByRole("switch", { name: "My Calendar" }));
    fireEvent.change(screen.getByLabelText("Parent's email address"), {
      target: { value: "parent@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send invitation/i }));

    await waitFor(() => {
      expect(mockSendParentInvitation).toHaveBeenCalledWith("parent@example.com", {
        share_tasks: true,
        share_calendar: false,
        share_content: true,
      });
    });
  });

  it("renders the pending state with disabled sharing toggles", () => {
    render(
      <ParentPackManager
        {...defaultProps}
        initialStatus="pending"
        initialParentEmail="parent@example.com"
      />
    );

    expect(
      screen.getByText(/invitation pending.*waiting for parent@example\.com/i)
    ).toBeInTheDocument();

    openSettings();

    expect(screen.getByRole("switch", { name: "My Plan & Tasks" })).toBeDisabled();
  });

  it("stages sharing changes until save is clicked for a connected parent", async () => {
    render(
      <ParentPackManager
        {...defaultProps}
        initialStatus="accepted"
        initialParentEmail="parent@example.com"
      />
    );
    openSettings();

    fireEvent.click(screen.getByRole("switch", { name: "My Content" }));

    expect(mockUpdateParentSharing).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: /save changes/i })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(mockUpdateParentSharing).toHaveBeenCalledWith({
        share_tasks: true,
        share_calendar: true,
        share_content: false,
      });
    });
  });

  it("restores the saved sharing state when cancel is clicked", () => {
    render(
      <ParentPackManager
        {...defaultProps}
        initialStatus="accepted"
        initialParentEmail="parent@example.com"
      />
    );
    openSettings();

    fireEvent.click(screen.getByRole("switch", { name: "My Calendar" }));
    expect(screen.getByRole("switch", { name: "My Calendar" })).toHaveAttribute(
      "aria-checked",
      "false"
    );

    fireEvent.click(screen.getByRole("button", { name: /^cancel$/i }));

    expect(screen.getByRole("switch", { name: "My Calendar" })).toHaveAttribute(
      "aria-checked",
      "true"
    );
    expect(mockUpdateParentSharing).not.toHaveBeenCalled();
  });

  it("shows the Parent Pack resource link", () => {
    render(
      <ParentPackManager
        {...defaultProps}
        initialStatus="accepted"
        initialParentEmail="parent@example.com"
      />
    );

    expect(screen.getByRole("link", { name: /open parent pack/i })).toHaveAttribute(
      "href",
      "https://notion.so/parent-pack"
    );
  });

  it("shows the remove parent access action after expanding settings", () => {
    render(
      <ParentPackManager
        {...defaultProps}
        initialStatus="accepted"
        initialParentEmail="parent@example.com"
      />
    );
    openSettings();

    expect(screen.getByRole("button", { name: /remove parent access/i })).toBeInTheDocument();
  });
});
