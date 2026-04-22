import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { PlanTemplateModal } from "@/components/admin/PlanTemplateModal";
import type { PlanTaskTemplate } from "@/lib/types/plan";

jest.mock("../../../lib/actions/admin/planTemplates", () => ({
  createPlanTemplate: jest.fn(),
  updatePlanTemplate: jest.fn(),
}));

import {
  createPlanTemplate,
  updatePlanTemplate,
} from "../../../lib/actions/admin/planTemplates";

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
  });

  it("renders all form fields in create mode", () => {
    render(<PlanTemplateModal mode="create" onClose={jest.fn()} />);

    expect(screen.getByRole("heading", { name: /add template/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^phase$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/days from arrival/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tier required/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/content url/i)).toBeInTheDocument();
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
    fireEvent.change(screen.getByLabelText(/content url/i), {
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
});
