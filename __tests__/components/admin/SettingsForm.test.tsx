import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SettingsForm } from "@/components/admin/SettingsForm";

const mockSaveAdminSettings = jest.fn();

jest.mock("../../../lib/actions/admin/settings", () => ({
  saveAdminSettings: (...args: unknown[]) => mockSaveAdminSettings(...args),
}));

const defaultInitialValues = {
  whatsappInviteLink: "",
  parentPackNotionUrl: "",
  parentContentNotionUrl: "",
  instagramUrl: "",
  tiktokUrl: "",
  affiliateDisclosureEnabled: false,
};

describe("SettingsForm", () => {
  beforeEach(() => {
    mockSaveAdminSettings.mockReset();
  });

  it("renders without error", () => {
    const { container } = render(
      <SettingsForm initialValues={defaultInitialValues} />
    );
    expect(container).toBeTruthy();
  });

  it("pre-fills the WhatsApp input with the initial link", () => {
    render(
      <SettingsForm
        initialValues={{
          ...defaultInitialValues,
          whatsappInviteLink: "https://chat.whatsapp.com/abc123",
        }}
      />
    );
    const input = screen.getByPlaceholderText(/whatsapp/i);
    expect(input).toHaveValue("https://chat.whatsapp.com/abc123");
  });

  it("renders the two Notion URL fields", () => {
    render(
      <SettingsForm initialValues={defaultInitialValues} />
    );

    expect(screen.getByLabelText(/parent pack notion url/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/parent content notion url/i)).toBeInTheDocument();
  });

  it("renders the save button", () => {
    render(
      <SettingsForm initialValues={defaultInitialValues} />
    );
    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
  });

  it("shows success message after successful save", async () => {
    mockSaveAdminSettings.mockResolvedValue({ success: true });
    render(
      <SettingsForm
        initialValues={{
          ...defaultInitialValues,
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
      <SettingsForm initialValues={defaultInitialValues} />
    );

    fireEvent.change(screen.getByLabelText(/whatsapp invite link/i), {
      target: { value: "https://chat.whatsapp.com/new" },
    });

    fireEvent.submit(screen.getByRole("button", { name: /save/i }).closest("form")!);

    await waitFor(() => {
      expect(screen.getByText("All settings fields are required.")).toBeInTheDocument();
    });
  });

  it("renders footer and legal fields", () => {
    render(<SettingsForm initialValues={defaultInitialValues} />);

    expect(screen.getByText("Footer & Legal")).toBeInTheDocument();
    expect(screen.getByLabelText(/instagram url/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tiktok url/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/show affiliate disclosure/i)).toBeInTheDocument();
  });

  it("submits footer values with boolean disclosure state", async () => {
    mockSaveAdminSettings.mockResolvedValue({ success: true });
    render(<SettingsForm initialValues={defaultInitialValues} />);

    fireEvent.change(screen.getByLabelText(/whatsapp invite link/i), {
      target: { value: "https://chat.whatsapp.com/new" },
    });
    fireEvent.change(screen.getByLabelText(/parent pack notion url/i), {
      target: { value: "https://notion.so/student" },
    });
    fireEvent.change(screen.getByLabelText(/parent content notion url/i), {
      target: { value: "https://notion.so/parent" },
    });
    fireEvent.change(screen.getByLabelText(/instagram url/i), {
      target: { value: "https://instagram.com/ustart.us" },
    });
    fireEvent.click(screen.getByLabelText(/show affiliate disclosure/i));

    fireEvent.submit(screen.getByRole("button", { name: /save/i }).closest("form")!);

    await waitFor(() => {
      expect(mockSaveAdminSettings).toHaveBeenCalledWith({
        whatsappInviteLink: "https://chat.whatsapp.com/new",
        parentPackNotionUrl: "https://notion.so/student",
        parentContentNotionUrl: "https://notion.so/parent",
        instagramUrl: "https://instagram.com/ustart.us",
        tiktokUrl: "",
        affiliateDisclosureEnabled: true,
      });
    });
  });
});
