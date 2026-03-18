import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SettingsForm } from "@/components/admin/SettingsForm";

const mockSaveWhatsappLink = jest.fn();

jest.mock("../../../lib/actions/admin/settings", () => ({
  saveWhatsappLink: (...args: unknown[]) => mockSaveWhatsappLink(...args),
}));

describe("SettingsForm", () => {
  beforeEach(() => {
    mockSaveWhatsappLink.mockReset();
  });

  it("renders without error", () => {
    const { container } = render(<SettingsForm initialLink="" />);
    expect(container).toBeTruthy();
  });

  it("pre-fills the input with the initial link", () => {
    render(<SettingsForm initialLink="https://chat.whatsapp.com/abc123" />);
    const input = screen.getByPlaceholderText(/whatsapp/i);
    expect(input).toHaveValue("https://chat.whatsapp.com/abc123");
  });

  it("renders the save button", () => {
    render(<SettingsForm initialLink="" />);
    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
  });

  it("shows success message after successful save", async () => {
    mockSaveWhatsappLink.mockResolvedValue({ success: true });
    render(<SettingsForm initialLink="https://chat.whatsapp.com/old" />);

    fireEvent.submit(screen.getByRole("button", { name: /save/i }).closest("form")!);

    await waitFor(() => {
      expect(screen.getByText(/saved successfully/i)).toBeInTheDocument();
    });
  });

  it("shows error message on failure", async () => {
    mockSaveWhatsappLink.mockResolvedValue({ success: false, error: "Link cannot be empty." });
    render(<SettingsForm initialLink="" />);

    fireEvent.submit(screen.getByRole("button", { name: /save/i }).closest("form")!);

    await waitFor(() => {
      expect(screen.getByText("Link cannot be empty.")).toBeInTheDocument();
    });
  });
});
