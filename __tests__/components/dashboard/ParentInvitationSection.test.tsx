import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { ParentInvitationSection } from "@/components/dashboard/ParentInvitationSection";

const mockSend = jest.fn();
const mockResend = jest.fn();
const mockCancel = jest.fn();
const mockUnlink = jest.fn();

jest.mock("../../../lib/actions/parentInvitation", () => ({
  sendParentInvitation: (...args: unknown[]) => mockSend(...args),
  resendParentInvitation: () => mockResend(),
  cancelParentInvitation: () => mockCancel(),
  unlinkParent: () => mockUnlink(),
}));

describe("ParentInvitationSection", () => {
  beforeEach(() => {
    mockSend.mockReset();
    mockResend.mockReset();
    mockCancel.mockReset();
    mockUnlink.mockReset();
  });

  describe("State 1 — no invitation", () => {
    it("renders email input and Send Invitation button", () => {
      render(<ParentInvitationSection initialStatus={null} initialParentEmail={null} />);
      expect(screen.getByPlaceholderText(/parent's email address/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /send invitation/i })).toBeInTheDocument();
    });

    it("disables the button when the email input is empty", () => {
      render(<ParentInvitationSection initialStatus={null} initialParentEmail={null} />);
      expect(screen.getByRole("button", { name: /send invitation/i })).toBeDisabled();
    });

    it("enables the button when email is typed", () => {
      render(<ParentInvitationSection initialStatus={null} initialParentEmail={null} />);
      fireEvent.change(screen.getByPlaceholderText(/parent's email address/i), {
        target: { value: "parent@example.com" },
      });
      expect(screen.getByRole("button", { name: /send invitation/i })).not.toBeDisabled();
    });

    it("transitions to pending state on successful send", async () => {
      mockSend.mockResolvedValueOnce({ success: true });
      render(<ParentInvitationSection initialStatus={null} initialParentEmail={null} />);

      fireEvent.change(screen.getByPlaceholderText(/parent's email address/i), {
        target: { value: "parent@example.com" },
      });
      fireEvent.click(screen.getByRole("button", { name: /send invitation/i }));

      await waitFor(() =>
        expect(screen.getByText(/invitation sent to/i)).toBeInTheDocument()
      );
      expect(screen.getByText("parent@example.com")).toBeInTheDocument();
    });

    it("shows error message on failed send", async () => {
      mockSend.mockResolvedValueOnce({ success: false, error: "Invalid email." });
      render(<ParentInvitationSection initialStatus={null} initialParentEmail={null} />);

      fireEvent.change(screen.getByPlaceholderText(/parent's email address/i), {
        target: { value: "bad-email" },
      });
      fireEvent.click(screen.getByRole("button", { name: /send invitation/i }));

      await waitFor(() =>
        expect(screen.getByText("Invalid email.")).toBeInTheDocument()
      );
    });
  });

  describe("State 2 — pending invitation", () => {
    it("renders the pending email and action buttons", () => {
      render(
        <ParentInvitationSection
          initialStatus="pending"
          initialParentEmail="parent@example.com"
        />
      );
      expect(screen.getByText("parent@example.com")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /resend invitation/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /cancel invitation/i })).toBeInTheDocument();
    });

    it("calls resendParentInvitation on resend click", async () => {
      mockResend.mockResolvedValueOnce({ success: true });
      render(
        <ParentInvitationSection
          initialStatus="pending"
          initialParentEmail="parent@example.com"
        />
      );
      fireEvent.click(screen.getByRole("button", { name: /resend invitation/i }));
      await waitFor(() => expect(mockResend).toHaveBeenCalledTimes(1));
    });

    it("shows success message after successful resend", async () => {
      mockResend.mockResolvedValueOnce({ success: true });
      render(
        <ParentInvitationSection
          initialStatus="pending"
          initialParentEmail="parent@example.com"
        />
      );
      fireEvent.click(screen.getByRole("button", { name: /resend invitation/i }));
      await waitFor(() =>
        expect(screen.getByText("Invitation resent successfully.")).toBeInTheDocument()
      );
    });

    it("shows error message on failed resend", async () => {
      mockResend.mockResolvedValueOnce({ success: false, error: "Rate limited." });
      render(
        <ParentInvitationSection
          initialStatus="pending"
          initialParentEmail="parent@example.com"
        />
      );
      fireEvent.click(screen.getByRole("button", { name: /resend invitation/i }));
      await waitFor(() => expect(screen.getByText("Rate limited.")).toBeInTheDocument());
    });

    it("shows 'Invitation cancelled.' then transitions to State 1", async () => {
      jest.useFakeTimers();
      mockCancel.mockResolvedValueOnce({ success: true });
      render(
        <ParentInvitationSection
          initialStatus="pending"
          initialParentEmail="parent@example.com"
        />
      );
      fireEvent.click(screen.getByRole("button", { name: /cancel invitation/i }));

      // Wait for the async action to resolve and the success message to appear.
      await act(async () => {
        await mockCancel.mock.results[0].value;
      });
      expect(screen.getByText("Invitation cancelled.")).toBeInTheDocument();

      // Advance past the 1500 ms delay and confirm the form resets to State 1.
      act(() => jest.advanceTimersByTime(2000));
      expect(screen.getByPlaceholderText(/parent's email address/i)).toBeInTheDocument();

      jest.useRealTimers();
    });
  });

  describe("State 3 — accepted invitation", () => {
    it("renders the linked parent email and Unlink button", () => {
      render(
        <ParentInvitationSection
          initialStatus="accepted"
          initialParentEmail="parent@example.com"
        />
      );
      expect(screen.getByText("parent@example.com")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /unlink parent/i })).toBeInTheDocument();
    });

    it("shows inline confirm when Unlink is clicked", () => {
      render(
        <ParentInvitationSection
          initialStatus="accepted"
          initialParentEmail="parent@example.com"
        />
      );
      fireEvent.click(screen.getByRole("button", { name: /unlink parent/i }));
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /yes, unlink/i })).toBeInTheDocument();
    });

    it("cancels confirm dialog without calling unlinkParent", () => {
      render(
        <ParentInvitationSection
          initialStatus="accepted"
          initialParentEmail="parent@example.com"
        />
      );
      fireEvent.click(screen.getByRole("button", { name: /unlink parent/i }));
      fireEvent.click(screen.getByRole("button", { name: /^cancel$/i }));
      expect(screen.getByRole("button", { name: /unlink parent/i })).toBeInTheDocument();
      expect(mockUnlink).not.toHaveBeenCalled();
    });

    it("shows 'Parent unlinked successfully.' then transitions to State 1", async () => {
      jest.useFakeTimers();
      mockUnlink.mockResolvedValueOnce({ success: true });
      render(
        <ParentInvitationSection
          initialStatus="accepted"
          initialParentEmail="parent@example.com"
        />
      );
      fireEvent.click(screen.getByRole("button", { name: /unlink parent/i }));
      fireEvent.click(screen.getByRole("button", { name: /yes, unlink/i }));

      // Wait for the async action to resolve and the success message to appear.
      await act(async () => {
        await mockUnlink.mock.results[0].value;
      });
      expect(screen.getByText("Parent unlinked successfully.")).toBeInTheDocument();

      // Advance past the 1500 ms delay and confirm the form resets to State 1.
      act(() => jest.advanceTimersByTime(2000));
      expect(screen.getByPlaceholderText(/parent's email address/i)).toBeInTheDocument();

      jest.useRealTimers();
    });
  });
});
