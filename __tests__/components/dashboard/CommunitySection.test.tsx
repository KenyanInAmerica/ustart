import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CommunitySection } from "@/components/dashboard/CommunitySection";

jest.mock("../../../lib/actions/acceptCommunityRules", () => ({
  acceptCommunityRules: jest.fn(),
}));

import { acceptCommunityRules } from "../../../lib/actions/acceptCommunityRules";

const baseProps = {
  hasAgreedToCommunity: false,
  phoneNumber: null,
  whatsappLink: "https://chat.whatsapp.com/test",
};

describe("CommunitySection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders without error", () => {
    const { container } = render(<CommunitySection {...baseProps} />);
    expect(container).toBeTruthy();
  });

  // ── Agreed state ──────────────────────────────────────────────────────────

  it("shows the WhatsApp link when hasAgreedToCommunity is true", () => {
    render(<CommunitySection {...baseProps} hasAgreedToCommunity={true} />);
    expect(screen.getByText(/your community access is active/i)).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /open whatsapp group/i });
    expect(link).toHaveAttribute("href", "https://chat.whatsapp.com/test");
  });

  it("does not show the checkbox when already agreed", () => {
    render(<CommunitySection {...baseProps} hasAgreedToCommunity={true} />);
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  // ── Not agreed state ──────────────────────────────────────────────────────

  it("shows the rules summary when not yet agreed", () => {
    render(<CommunitySection {...baseProps} />);
    expect(screen.getByText(/be respectful/i)).toBeInTheDocument();
  });

  it("renders a link to the full community rules page", () => {
    render(<CommunitySection {...baseProps} />);
    const link = screen.getByRole("link", { name: /read the full rules/i });
    expect(link).toHaveAttribute("href", "/community-rules");
  });

  it("renders the agreement checkbox when not yet agreed", () => {
    render(<CommunitySection {...baseProps} />);
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
  });

  it("does not show the WhatsApp link when not yet agreed", () => {
    render(<CommunitySection {...baseProps} />);
    expect(
      screen.queryByRole("link", { name: /open whatsapp group/i })
    ).not.toBeInTheDocument();
  });

  // ── Modal ─────────────────────────────────────────────────────────────────

  it("opens the modal when the checkbox is checked", () => {
    render(<CommunitySection {...baseProps} />);
    fireEvent.click(screen.getByRole("checkbox"));
    expect(
      screen.getByRole("heading", { name: /one last step/i })
    ).toBeInTheDocument();
  });

  it("pre-fills the phone input when phoneNumber prop is provided", () => {
    render(<CommunitySection {...baseProps} phoneNumber="+12025551234" />);
    fireEvent.click(screen.getByRole("checkbox"));
    expect(screen.getByRole("textbox")).toHaveValue("+12025551234");
  });

  it("closes the modal and unchecks the checkbox when Cancel is clicked", () => {
    render(<CommunitySection {...baseProps} />);
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(
      screen.queryByRole("heading", { name: /one last step/i })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });

  it("shows a validation error for an invalid phone number on submit", async () => {
    render(<CommunitySection {...baseProps} />);
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "not-a-phone" },
    });
    fireEvent.click(screen.getByRole("button", { name: /confirm/i }));
    expect(
      await screen.findByText(/valid international number/i)
    ).toBeInTheDocument();
    expect(acceptCommunityRules).not.toHaveBeenCalled();
  });

  it("calls acceptCommunityRules and shows WhatsApp link on success", async () => {
    (acceptCommunityRules as jest.Mock).mockResolvedValue({ success: true });
    render(<CommunitySection {...baseProps} />);
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "+12025551234" },
    });
    fireEvent.click(screen.getByRole("button", { name: /confirm/i }));
    await waitFor(() =>
      expect(
        screen.getByRole("link", { name: /open whatsapp group/i })
      ).toBeInTheDocument()
    );
  });

  it("shows a server error inside the modal when acceptCommunityRules fails", async () => {
    (acceptCommunityRules as jest.Mock).mockResolvedValue({
      success: false,
      error: "Something went wrong.",
    });
    render(<CommunitySection {...baseProps} />);
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "+12025551234" },
    });
    fireEvent.click(screen.getByRole("button", { name: /confirm/i }));
    expect(
      await screen.findByText(/something went wrong/i)
    ).toBeInTheDocument();
    // Modal stays open on error
    expect(
      screen.getByRole("heading", { name: /one last step/i })
    ).toBeInTheDocument();
  });
});
