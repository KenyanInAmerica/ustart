import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { ContactPanel } from "@/components/ui/ContactPanel";

const mockSubmitContactForm = jest.fn();
const mockGetUser = jest.fn();
const mockMaybeSingle = jest.fn();

jest.mock("../../../lib/actions/contactForm", () => ({
  submitContactForm: (...args: unknown[]) => mockSubmitContactForm(...args),
}));

// useUser hook — returns user from browser Supabase client.
jest.mock("@supabase/ssr", () => ({
  createBrowserClient: jest.fn(() => ({
    auth: {
      getUser: mockGetUser,
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          maybeSingle: mockMaybeSingle,
        })),
      })),
    })),
  })),
}));

const mockOnClose = jest.fn();

beforeEach(() => {
  mockSubmitContactForm.mockReset();
  mockGetUser.mockReset();
  mockMaybeSingle.mockReset();
  mockOnClose.mockReset();
  // Default: unauthenticated
  mockGetUser.mockResolvedValue({ data: { user: null } });
});

describe("ContactPanel", () => {
  it("renders nothing when isOpen is false", () => {
    const { container } = render(
      <ContactPanel isOpen={false} onClose={mockOnClose} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders the panel when isOpen is true", () => {
    render(<ContactPanel isOpen={true} onClose={mockOnClose} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("renders name, email, and message inputs for unauthenticated users", () => {
    render(<ContactPanel isOpen={true} onClose={mockOnClose} />);
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
  });

  it("renders the send button", () => {
    render(<ContactPanel isOpen={true} onClose={mockOnClose} />);
    expect(
      screen.getByRole("button", { name: /send message/i })
    ).toBeInTheDocument();
  });

  it("calls onClose when the close button is clicked", () => {
    render(<ContactPanel isOpen={true} onClose={mockOnClose} />);
    fireEvent.click(screen.getByRole("button", { name: /close contact panel/i }));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("shows error message on failed submission", async () => {
    mockSubmitContactForm.mockResolvedValue({
      success: false,
      error: "All fields are required.",
    });
    render(<ContactPanel isOpen={true} onClose={mockOnClose} />);

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: "Bob" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "bob@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/message/i), {
      target: { value: "Hello" },
    });
    fireEvent.submit(screen.getByRole("dialog").querySelector("form")!);

    await waitFor(() =>
      expect(
        screen.getByText("All fields are required.")
      ).toBeInTheDocument()
    );
  });

  it("shows success message and auto-closes after 3 seconds", async () => {
    jest.useFakeTimers();
    mockSubmitContactForm.mockResolvedValue({ success: true });
    render(<ContactPanel isOpen={true} onClose={mockOnClose} />);

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: "Alice" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "alice@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/message/i), {
      target: { value: "Hello" },
    });
    fireEvent.submit(screen.getByRole("dialog").querySelector("form")!);

    await waitFor(() =>
      expect(screen.getByText(/message sent/i)).toBeInTheDocument()
    );

    act(() => { jest.advanceTimersByTime(3000); });
    expect(mockOnClose).toHaveBeenCalled();
    jest.useRealTimers();
  });
});
