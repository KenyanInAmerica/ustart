import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { InvitationLinkForm } from "@/components/admin/InvitationLinkForm";

const mockAdminLinkParent = jest.fn();

jest.mock("../../../lib/actions/admin/invitations", () => ({
  adminLinkParent: (...args: unknown[]) => mockAdminLinkParent(...args),
}));

describe("InvitationLinkForm", () => {
  beforeEach(() => {
    mockAdminLinkParent.mockReset();
  });

  it("renders without error", () => {
    const { container } = render(<InvitationLinkForm />);
    expect(container).toBeTruthy();
  });

  it("renders student and parent email inputs", () => {
    render(<InvitationLinkForm />);
    expect(screen.getByPlaceholderText(/student@example/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/parent@example/i)).toBeInTheDocument();
  });

  it("renders the link button", () => {
    render(<InvitationLinkForm />);
    expect(screen.getByRole("button", { name: /link parent/i })).toBeInTheDocument();
  });

  it("shows success and clears inputs on success", async () => {
    mockAdminLinkParent.mockResolvedValue({ success: true });
    render(<InvitationLinkForm />);

    fireEvent.change(screen.getByPlaceholderText(/student@example/i), {
      target: { value: "student@test.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/parent@example/i), {
      target: { value: "parent@test.com" },
    });

    fireEvent.submit(screen.getByRole("button", { name: /link parent/i }).closest("form")!);

    await waitFor(() => {
      expect(screen.getByText(/linked successfully/i)).toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText(/student@example/i)).toHaveValue("");
  });

  it("auto-dismisses success message after 3 seconds", async () => {
    jest.useFakeTimers();
    mockAdminLinkParent.mockResolvedValue({ success: true });
    render(<InvitationLinkForm />);

    fireEvent.change(screen.getByPlaceholderText(/student@example/i), {
      target: { value: "student@test.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/parent@example/i), {
      target: { value: "parent@test.com" },
    });
    fireEvent.submit(screen.getByRole("button", { name: /link parent/i }).closest("form")!);

    await waitFor(() =>
      expect(screen.getByText(/linked successfully/i)).toBeInTheDocument()
    );
    act(() => { jest.advanceTimersByTime(3000); });
    expect(screen.queryByText(/linked successfully/i)).not.toBeInTheDocument();
    jest.useRealTimers();
  });

  it("shows error message on failure", async () => {
    mockAdminLinkParent.mockResolvedValue({ success: false, error: "No account found for that student email." });
    render(<InvitationLinkForm />);

    fireEvent.change(screen.getByPlaceholderText(/student@example/i), {
      target: { value: "missing@test.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/parent@example/i), {
      target: { value: "parent@test.com" },
    });

    fireEvent.submit(screen.getByRole("button", { name: /link parent/i }).closest("form")!);

    await waitFor(() => {
      expect(screen.getByText("No account found for that student email.")).toBeInTheDocument();
    });
  });
});
