import { render, screen, fireEvent } from "@testing-library/react";
import { Footer } from "@/components/ui/Footer";

// Footer calls useContactForm() — mock the context hook.
const mockOpen = jest.fn();
jest.mock("../../../components/ui/ContactFormProvider", () => ({
  useContactForm: jest.fn(() => ({ open: mockOpen, close: jest.fn() })),
}));

beforeEach(() => {
  mockOpen.mockReset();
});

describe("Footer", () => {
  it("renders without error", () => {
    const { container } = render(<Footer />);
    expect(container).toBeTruthy();
  });

  it("renders a footer element", () => {
    const { container } = render(<Footer />);
    expect(container.querySelector("footer")).toBeInTheDocument();
  });

  it("renders the UStart wordmark linking to /", () => {
    render(<Footer />);
    const wordmark = screen.getByRole("link", { name: "UStart" });
    expect(wordmark).toBeInTheDocument();
    expect(wordmark).toHaveAttribute("href", "/");
  });

  it("renders the Privacy Policy link", () => {
    render(<Footer />);
    const link = screen.getByRole("link", { name: "Privacy Policy" });
    expect(link).toHaveAttribute("href", "/privacy");
  });

  it("renders the Terms link", () => {
    render(<Footer />);
    const link = screen.getByRole("link", { name: "Terms" });
    expect(link).toHaveAttribute("href", "/terms");
  });

  it("renders a Contact button (not a link) that opens the panel", () => {
    render(<Footer />);
    // Contact is now a button that triggers the panel, not a <Link>
    const contactBtn = screen.getByRole("button", { name: /contact/i });
    expect(contactBtn).toBeInTheDocument();
    fireEvent.click(contactBtn);
    expect(mockOpen).toHaveBeenCalledTimes(1);
  });

  it("renders the copyright notice", () => {
    render(<Footer />);
    expect(screen.getByText(/2026 UStart/)).toBeInTheDocument();
  });
});
