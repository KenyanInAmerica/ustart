import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { PlanTemplateModal } from "@/components/admin/PlanTemplateModal";
import type { PlanTaskTemplate } from "@/lib/types/plan";

jest.mock("../../../lib/actions/admin/planTemplates", () => ({
  createPlanTemplate: jest.fn(),
  updatePlanTemplate: jest.fn(),
}));

jest.mock("../../../lib/actions/admin/verifyNotionUrl", () => ({
  verifyNotionUrl: jest.fn(),
}));

jest.mock("../../../lib/notion/urlConverter", () => ({
  isNotionUrl: jest.fn((url: string) => url.startsWith("https://notion.so")),
  isUStartContentUrl: jest.fn((url: string) =>
    /^\/dashboard\/content\/(lite|explore|concierge)\/[a-z0-9-]+$/.test(url)
  ),
}));

import {
  createPlanTemplate,
  updatePlanTemplate,
} from "../../../lib/actions/admin/planTemplates";
import { verifyNotionUrl } from "../../../lib/actions/admin/verifyNotionUrl";

const mockTemplate: PlanTaskTemplate = {
  id: "template-1",
  title: "Open a bank account",
  description: "Bring your passport and I-20.",
  phase: "first_7_days",
  days_from_arrival: 3,
  content_url: "https://notion.so/bank",
  tier_required: "explore",
  display_order: 2,
  created_at: "2026-04-21T12:00:00.000Z",
  updated_at: "2026-04-21T12:00:00.000Z",
};

describe("PlanTemplateModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (createPlanTemplate as jest.Mock).mockResolvedValue({ success: true });
    (updatePlanTemplate as jest.Mock).mockResolvedValue({ success: true });
    (verifyNotionUrl as jest.Mock).mockResolvedValue({
      valid: false,
      pageTitle: null,
      convertedUrl: null,
      error: "Not tested",
    });
  });

  it("renders all form fields and the Generate UStart Link button in create mode", () => {
    render(<PlanTemplateModal mode="create" onClose={jest.fn()} />);

    expect(screen.getByRole("heading", { name: /add template/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^phase$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/days from arrival/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tier required/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /generate ustart link/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /preview/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/display order/i)).not.toBeInTheDocument();
    expect(
      screen.getByText(/negative numbers schedule tasks before arrival/i)
    ).toBeInTheDocument();
  });

  it("submits create mode values", async () => {
    const onClose = jest.fn();
    render(<PlanTemplateModal mode="create" onClose={onClose} />);

    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: "Apply for SSN" },
    });
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: "Visit the local SSA office." },
    });
    fireEvent.change(screen.getByLabelText(/^phase$/i), {
      target: { value: "settling_in" },
    });
    fireEvent.change(screen.getByLabelText(/days from arrival/i), {
      target: { value: "10" },
    });
    fireEvent.change(screen.getByLabelText(/tier required/i), {
      target: { value: "concierge" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /content url/i }), {
      target: { value: "https://notion.so/ssn" },
    });

    fireEvent.click(screen.getByRole("button", { name: /create template/i }));

    await waitFor(() =>
      expect(createPlanTemplate).toHaveBeenCalledWith({
        title: "Apply for SSN",
        description: "Visit the local SSA office.",
        phase: "settling_in",
        days_from_arrival: 10,
        tier_required: "concierge",
        content_url: "https://notion.so/ssn",
      })
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("pre-fills template values in edit mode and saves changes", async () => {
    const onClose = jest.fn();
    render(
      <PlanTemplateModal mode="edit" template={mockTemplate} onClose={onClose} />
    );

    expect(screen.getByDisplayValue("Open a bank account")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Bring your passport and I-20.")).toBeInTheDocument();
    expect(screen.getByDisplayValue("3")).toBeInTheDocument();
    expect(screen.getByDisplayValue("https://notion.so/bank")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: "Open a checking account" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() =>
      expect(updatePlanTemplate).toHaveBeenCalledWith("template-1", {
        title: "Open a checking account",
        description: "Bring your passport and I-20.",
        phase: "first_7_days",
        days_from_arrival: 3,
        tier_required: "explore",
        content_url: "https://notion.so/bank",
      })
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows inline errors returned by the action", async () => {
    (createPlanTemplate as jest.Mock).mockResolvedValueOnce({
      success: false,
      error: "Title is required.",
    });

    render(<PlanTemplateModal mode="create" onClose={jest.fn()} />);

    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: "Task" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create template/i }));

    expect(await screen.findByText("Title is required.")).toBeInTheDocument();
  });

  it("allows negative days from arrival", async () => {
    render(<PlanTemplateModal mode="create" onClose={jest.fn()} />);

    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: "Pre-arrival prep" },
    });
    fireEvent.change(screen.getByLabelText(/days from arrival/i), {
      target: { value: "-14" },
    });

    fireEvent.click(screen.getByRole("button", { name: /create template/i }));

    await waitFor(() =>
      expect(createPlanTemplate).toHaveBeenCalledWith(
        expect.objectContaining({ days_from_arrival: -14 })
      )
    );
  });

  // --- Generate UStart Link button ---

  it("Generate UStart Link button is disabled when the content URL field is empty", () => {
    render(<PlanTemplateModal mode="create" onClose={jest.fn()} />);
    expect(screen.getByRole("button", { name: /generate ustart link/i })).toBeDisabled();
  });

  it("Generate UStart Link button is disabled for non-Notion URLs", () => {
    render(<PlanTemplateModal mode="create" onClose={jest.fn()} />);

    fireEvent.change(screen.getByRole("textbox", { name: /content url/i }), {
      target: { value: "/dashboard/content/lite/banking-basics" },
    });

    expect(screen.getByRole("button", { name: /generate ustart link/i })).toBeDisabled();
  });

  it("Generate UStart Link button is enabled for Notion URLs", () => {
    render(<PlanTemplateModal mode="create" onClose={jest.fn()} />);

    fireEvent.change(screen.getByRole("textbox", { name: /content url/i }), {
      target: { value: "https://notion.so/some-page-abc123" },
    });

    expect(screen.getByRole("button", { name: /generate ustart link/i })).not.toBeDisabled();
  });

  it("shows a disappearing 'Final URL' caption after successful Notion URL verification", async () => {
    (verifyNotionUrl as jest.Mock).mockResolvedValue({
      valid: true,
      pageTitle: "Banking Basics",
      convertedUrl: "/dashboard/content/lite/banking-basics",
      error: null,
    });

    render(<PlanTemplateModal mode="create" onClose={jest.fn()} />);

    fireEvent.change(screen.getByRole("textbox", { name: /content url/i }), {
      target: { value: "https://notion.so/Banking-Basics-abc123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /generate ustart link/i }));

    await waitFor(() =>
      expect(screen.getByText(/✓ Final URL: \/dashboard\/content\/lite\/banking-basics/)).toBeInTheDocument()
    );
    // Field value should be updated to the UStart URL
    expect(screen.getByDisplayValue("/dashboard/content/lite/banking-basics")).toBeInTheDocument();
  });

  it("shows an error when Notion page is not accessible", async () => {
    (verifyNotionUrl as jest.Mock).mockResolvedValue({
      valid: false,
      pageTitle: null,
      convertedUrl: null,
      error: "Page not found or not accessible. Make sure the page is shared with the UStart integration.",
    });

    render(<PlanTemplateModal mode="create" onClose={jest.fn()} />);

    fireEvent.change(screen.getByRole("textbox", { name: /content url/i }), {
      target: { value: "https://notion.so/Missing-Page-abc123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /generate ustart link/i }));

    expect(await screen.findByText(/Page not found or not accessible/i)).toBeInTheDocument();
    expect(verifyNotionUrl).toHaveBeenCalledTimes(1);
  });

  it("clears the verification caption when user edits the field", async () => {
    (verifyNotionUrl as jest.Mock).mockResolvedValue({
      valid: true,
      pageTitle: "Banking Basics",
      convertedUrl: "/dashboard/content/lite/banking-basics",
      error: null,
    });

    render(<PlanTemplateModal mode="create" onClose={jest.fn()} />);

    const urlInput = screen.getByRole("textbox", { name: /content url/i });
    fireEvent.change(urlInput, { target: { value: "https://notion.so/Banking-Basics-abc123" } });
    fireEvent.click(screen.getByRole("button", { name: /generate ustart link/i }));

    await waitFor(() =>
      expect(screen.getByText(/✓ Final URL/)).toBeInTheDocument()
    );

    // User edits the field — caption clears immediately
    fireEvent.change(urlInput, { target: { value: "https://notion.so/other" } });
    expect(screen.queryByText(/✓ Final URL/)).not.toBeInTheDocument();
  });

  // --- Preview button ---

  it("Preview button is disabled when content URL does not start with '/'", () => {
    render(<PlanTemplateModal mode="create" onClose={jest.fn()} />);

    expect(screen.getByRole("button", { name: /preview/i })).toBeDisabled();

    fireEvent.change(screen.getByRole("textbox", { name: /content url/i }), {
      target: { value: "https://notion.so/some-page" },
    });

    expect(screen.getByRole("button", { name: /preview/i })).toBeDisabled();
  });

  it("Preview button is enabled when content URL starts with '/'", () => {
    render(<PlanTemplateModal mode="create" onClose={jest.fn()} />);

    fireEvent.change(screen.getByRole("textbox", { name: /content url/i }), {
      target: { value: "/dashboard/content/lite/banking-basics" },
    });

    expect(screen.getByRole("button", { name: /preview/i })).not.toBeDisabled();
  });

  it("Preview button opens a new tab with the current origin + path", () => {
    const openSpy = jest.spyOn(window, "open").mockImplementation(() => null);

    render(<PlanTemplateModal mode="create" onClose={jest.fn()} />);

    fireEvent.change(screen.getByRole("textbox", { name: /content url/i }), {
      target: { value: "/dashboard/content/lite/banking-basics" },
    });
    fireEvent.click(screen.getByRole("button", { name: /preview/i }));

    expect(openSpy).toHaveBeenCalledWith(
      expect.stringMatching(/\/dashboard\/content\/lite\/banking-basics$/),
      "_blank",
      "noreferrer"
    );

    openSpy.mockRestore();
  });
});
