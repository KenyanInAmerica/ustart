import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { PlanTaskEditModal } from "@/components/admin/PlanTaskEditModal";
import type { PlanTask } from "@/lib/types/plan";

jest.mock("../../../lib/actions/admin/planTasks", () => ({
  adminUpdatePlanTask: jest.fn(),
}));

import { adminUpdatePlanTask } from "../../../lib/actions/admin/planTasks";

const mockUpdate = adminUpdatePlanTask as jest.Mock;

const baseTask: PlanTask = {
  id: "task-1",
  title: "Open a bank account",
  description: "Bring your passport.",
  phase: "before_arrival",
  status: "not_started",
  due_date: "2099-09-01",
  content_url: "https://notion.so/task",
  video_url: null,
  accepts_upload: false,
  display_order: 1,
  completed_at: null,
};

describe("PlanTaskEditModal", () => {
  const onClose = jest.fn();
  const onSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdate.mockResolvedValue({ success: true });
  });

  it("renders with pre-populated field values", () => {
    render(<PlanTaskEditModal task={baseTask} onClose={onClose} onSave={onSave} />);
    expect((screen.getByLabelText(/title/i) as HTMLInputElement).value).toBe(
      "Open a bank account"
    );
    expect((screen.getByLabelText(/status/i) as HTMLSelectElement).value).toBe(
      "not_started"
    );
    expect((screen.getByLabelText(/due date/i) as HTMLInputElement).value).toBe(
      "2099-09-01"
    );
    expect(
      (screen.getByLabelText(/content url/i) as HTMLInputElement).value
    ).toBe("https://notion.so/task");
    expect(
      (screen.getByLabelText(/notes/i) as HTMLTextAreaElement).value
    ).toBe("Bring your passport.");
  });

  it("calls adminUpdatePlanTask with updated fields on save", async () => {
    render(<PlanTaskEditModal task={baseTask} onClose={onClose} onSave={onSave} />);

    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: "Updated title" },
    });
    fireEvent.change(screen.getByLabelText(/status/i), {
      target: { value: "in_progress" },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    });

    await waitFor(() =>
      expect(mockUpdate).toHaveBeenCalledWith(
        "task-1",
        expect.objectContaining({
          title: "Updated title",
          status: "in_progress",
        })
      )
    );
  });

  it("Save changes button is disabled when no fields have changed", () => {
    render(<PlanTaskEditModal task={baseTask} onClose={onClose} onSave={onSave} />);
    expect(screen.getByRole("button", { name: /save changes/i })).toBeDisabled();
  });

  it("Save changes button is enabled after changing a field", () => {
    render(<PlanTaskEditModal task={baseTask} onClose={onClose} onSave={onSave} />);
    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: "Modified title" },
    });
    expect(screen.getByRole("button", { name: /save changes/i })).not.toBeDisabled();
  });

  it("calls onSave with the optimistically updated task on success", async () => {
    render(<PlanTaskEditModal task={baseTask} onClose={onClose} onSave={onSave} />);

    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: "Updated title" },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    });

    await waitFor(() => expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ id: "task-1", status: "not_started" })
    ));
  });

  it("shows an error message when adminUpdatePlanTask fails", async () => {
    mockUpdate.mockResolvedValue({ success: false, error: "Update failed." });

    render(<PlanTaskEditModal task={baseTask} onClose={onClose} onSave={onSave} />);

    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: "Changed" },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    });

    await waitFor(() =>
      expect(screen.getByText("Update failed.")).toBeInTheDocument()
    );
    expect(onSave).not.toHaveBeenCalled();
  });

  it("calls onClose when the Cancel button is clicked", () => {
    render(<PlanTaskEditModal task={baseTask} onClose={onClose} onSave={onSave} />);
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when the backdrop is clicked", () => {
    render(<PlanTaskEditModal task={baseTask} onClose={onClose} onSave={onSave} />);
    // The backdrop is the first fixed div (aria-hidden)
    const backdrop = document.querySelector('[aria-hidden="true"]') as HTMLElement;
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalled();
  });

  it("changes to due date, content URL, and notes fields are included on submit", async () => {
    render(<PlanTaskEditModal task={baseTask} onClose={onClose} onSave={onSave} />);

    fireEvent.change(screen.getByLabelText(/due date/i), {
      target: { value: "2100-06-30" },
    });
    fireEvent.change(screen.getByLabelText(/content url/i), {
      target: { value: "https://example.com/resource" },
    });
    fireEvent.change(screen.getByLabelText(/notes/i), {
      target: { value: "Updated notes." },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    });

    await waitFor(() =>
      expect(mockUpdate).toHaveBeenCalledWith(
        "task-1",
        expect.objectContaining({
          due_date: "2100-06-30",
          content_url: "https://example.com/resource",
          description: "Updated notes.",
        })
      )
    );
  });
});
