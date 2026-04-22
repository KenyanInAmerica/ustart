import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { PlanTemplatesClient } from "@/components/admin/PlanTemplatesClient";
import type { PlanTaskTemplate } from "@/lib/types/plan";

jest.mock("../../../lib/actions/admin/planTemplates", () => ({
  deletePlanTemplate: jest.fn(),
  createPlanTemplate: jest.fn(),
  savePlanTemplateOrder: jest.fn(),
  updatePlanTemplate: jest.fn(),
}));

import {
  deletePlanTemplate,
  savePlanTemplateOrder,
} from "../../../lib/actions/admin/planTemplates";

function getButtonByExactText(label: string): HTMLButtonElement {
  const match = screen
    .getAllByRole("button")
    .find((button) => button.textContent?.trim() === label);

  if (!match) throw new Error(`Button with label "${label}" not found.`);
  return match as HTMLButtonElement;
}

const templates: PlanTaskTemplate[] = [
  {
    id: "template-1",
    title: "Book housing tour",
    description: "Shortlist apartments before arrival.",
    phase: "before_arrival",
    days_from_arrival: 0,
    content_url: "https://notion.so/housing",
    tier_required: "lite",
    display_order: 1,
    created_at: "2026-04-21T12:00:00.000Z",
    updated_at: "2026-04-21T12:00:00.000Z",
  },
  {
    id: "template-2",
    title: "Land at LAX",
    description: null,
    phase: "before_arrival",
    days_from_arrival: -7,
    content_url: null,
    tier_required: "lite",
    display_order: 0,
    created_at: "2026-04-21T11:00:00.000Z",
    updated_at: "2026-04-21T11:00:00.000Z",
  },
  {
    id: "template-3",
    title: "Set up Wi-Fi",
    description: null,
    phase: "first_7_days",
    days_from_arrival: 3,
    content_url: null,
    tier_required: "explore",
    display_order: 0,
    created_at: "2026-04-21T13:00:00.000Z",
    updated_at: "2026-04-21T13:00:00.000Z",
  },
];

describe("PlanTemplatesClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (deletePlanTemplate as jest.Mock).mockResolvedValue({ success: true });
    (savePlanTemplateOrder as jest.Mock).mockResolvedValue({ success: true });
  });

  it("shows the empty state when there are no templates", () => {
    render(<PlanTemplatesClient templates={[]} />);

    expect(screen.getByText(/no templates yet/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add template/i })).toBeInTheDocument();
  });

  it("opens the create modal from the Add template button", () => {
    render(<PlanTemplatesClient templates={[]} />);

    fireEvent.click(screen.getByRole("button", { name: /add template/i }));
    expect(screen.getByRole("heading", { name: /add template/i })).toBeInTheDocument();
  });

  it("opens the edit modal with existing data", () => {
    render(<PlanTemplatesClient templates={templates} />);

    fireEvent.click(getButtonByExactText("Edit"));
    expect(screen.getByRole("heading", { name: /edit template/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue("Book housing tour")).toBeInTheDocument();
  });

  it("uses inline confirmation before deleting", async () => {
    render(<PlanTemplatesClient templates={templates} />);

    fireEvent.click(getButtonByExactText("Delete"));
    expect(screen.getByText(/are you sure/i)).toBeInTheDocument();

    fireEvent.click(getButtonByExactText("Confirm"));

    await waitFor(() =>
      expect(deletePlanTemplate).toHaveBeenCalledWith("template-1")
    );
  });

  it("formats negative, zero, and positive arrival offsets", () => {
    render(<PlanTemplatesClient templates={templates} />);

    expect(screen.getByText("7 days before arrival")).toBeInTheDocument();
    expect(screen.getByText("Day of arrival")).toBeInTheDocument();
    expect(screen.getByText("3 days after arrival")).toBeInTheDocument();
  });

  it("toggles reorder mode and saves the current order", async () => {
    render(<PlanTemplatesClient templates={templates} />);

    fireEvent.click(screen.getByRole("button", { name: /reorder/i }));

    expect(screen.getByRole("button", { name: /^cancel$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save order/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^edit$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^delete$/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /save order/i }));

    await waitFor(() =>
      expect(savePlanTemplateOrder).toHaveBeenCalledWith([
        { id: "template-1", display_order: 0 },
        { id: "template-2", display_order: 1 },
        { id: "template-3", display_order: 0 },
      ])
    );
  });

  it("hides display order text in the list view", () => {
    render(<PlanTemplatesClient templates={templates} />);

    expect(screen.queryByText(/order \d/i)).not.toBeInTheDocument();
  });
});
