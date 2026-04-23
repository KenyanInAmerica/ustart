import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SettingsForm } from "@/components/admin/SettingsForm";

const mockSaveAdminSettings = jest.fn();

jest.mock("../../../lib/actions/admin/settings", () => ({
  saveAdminSettings: (...args: unknown[]) => mockSaveAdminSettings(...args),
}));

describe("SettingsForm", () => {
  beforeEach(() => {
    mockSaveAdminSettings.mockReset();
  });

  it("renders without error", () => {
    const { container } = render(
      <SettingsForm
        initialValues={{
          whatsappInviteLink: "",
          parentPackNotionUrl: "",
          parentContentNotionUrl: "",
        }}
      />
    );
    expect(container).toBeTruthy();
  });

  it("pre-fills the WhatsApp input with the initial link", () => {
    render(
      <SettingsForm
        initialValues={{
          whatsappInviteLink: "https://chat.whatsapp.com/abc123",
          parentPackNotionUrl: "https://notion.so/student",
          parentContentNotionUrl: "https://notion.so/parent",
        }}
      />
    );
    const input = screen.getByPlaceholderText(/whatsapp/i);
    expect(input).toHaveValue("https://chat.whatsapp.com/abc123");
  });

  it("renders the two Notion URL fields", () => {
    render(
      <SettingsForm
        initialValues={{
          whatsappInviteLink: "",
          parentPackNotionUrl: "",
          parentContentNotionUrl: "",
        }}
      />
    );

    expect(screen.getByLabelText(/parent pack notion url/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/parent content notion url/i)).toBeInTheDocument();
  });

  it("renders the save button", () => {
    render(
      <SettingsForm
        initialValues={{
          whatsappInviteLink: "",
          parentPackNotionUrl: "",
          parentContentNotionUrl: "",
        }}
      />
    );
    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
  });

  it("shows success message after successful save", async () => {
    mockSaveAdminSettings.mockResolvedValue({ success: true });
    render(
      <SettingsForm
        initialValues={{
          whatsappInviteLink: "https://chat.whatsapp.com/old",
          parentPackNotionUrl: "https://notion.so/student-old",
          parentContentNotionUrl: "https://notion.so/parent-old",
        }}
      />
    );

    fireEvent.change(screen.getByLabelText(/parent pack notion url/i), {
      target: { value: "https://notion.so/student-new" },
    });

    fireEvent.submit(screen.getByRole("button", { name: /save/i }).closest("form")!);

    await waitFor(() => {
      expect(screen.getByText(/saved successfully/i)).toBeInTheDocument();
    });
  });

  it("shows error message on failure", async () => {
    mockSaveAdminSettings.mockResolvedValue({
      success: false,
      error: "All settings fields are required.",
    });
    render(
      <SettingsForm
        initialValues={{
          whatsappInviteLink: "",
          parentPackNotionUrl: "",
          parentContentNotionUrl: "",
        }}
      />
    );

    fireEvent.change(screen.getByLabelText(/whatsapp invite link/i), {
      target: { value: "https://chat.whatsapp.com/new" },
    });

    fireEvent.submit(screen.getByRole("button", { name: /save/i }).closest("form")!);

    await waitFor(() => {
      expect(screen.getByText("All settings fields are required.")).toBeInTheDocument();
    });
  });
});
