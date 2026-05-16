import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { TaskStatusWidget } from "@/components/dashboard/TaskStatusWidget";
import type { PlanTask } from "@/lib/types/plan";

jest.mock("../../../lib/actions/plan", () => ({
  updateTaskStatus: jest.fn(),
}));

import { updateTaskStatus } from "../../../lib/actions/plan";

const task: PlanTask = {
  id: "task-1",
  title: "Open a bank account",
  description: "Bring your passport and I-20.",
  phase: "before_arrival",
  status: "not_started",
  due_date: "2099-09-01",
  content_url: "/dashboard/content/lite/banking-basics",
  display_order: 1,
  completed_at: null,
};

const phaseColor = "#4ECBA5";

describe("TaskStatusWidget", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (updateTaskStatus as jest.Mock).mockResolvedValue({ success: true });
  });

  it("renders the task title and label", () => {
    render(<TaskStatusWidget task={task} phaseColor={phaseColor} />);

    expect(screen.getByText("Open a bank account")).toBeInTheDocument();
    expect(screen.getByText(/this is a task in your plan/i)).toBeInTheDocument();
  });

  it("renders the due date when present", () => {
    render(<TaskStatusWidget task={task} phaseColor={phaseColor} />);
    expect(screen.getByText(/due sep/i)).toBeInTheDocument();
  });

  it("shows both Mark complete and Start task when status is not_started", () => {
    render(<TaskStatusWidget task={task} phaseColor={phaseColor} />);

    expect(screen.getByRole("button", { name: /mark complete/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start task/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /mark incomplete/i })).not.toBeInTheDocument();
  });

  it("shows only Mark complete when status is in_progress", () => {
    render(
      <TaskStatusWidget task={{ ...task, status: "in_progress" }} phaseColor={phaseColor} />
    );

    expect(screen.getByRole("button", { name: /mark complete/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /start task/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /mark incomplete/i })).not.toBeInTheDocument();
  });

  it("shows only Mark incomplete when status is completed", () => {
    render(
      <TaskStatusWidget
        task={{ ...task, status: "completed", completed_at: "2026-04-22T00:00:00.000Z" }}
        phaseColor={phaseColor}
      />
    );

    expect(screen.getByRole("button", { name: /mark incomplete/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /mark complete/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /start task/i })).not.toBeInTheDocument();
  });

  it("does not show any action buttons when readOnly is true", () => {
    render(<TaskStatusWidget task={task} phaseColor={phaseColor} readOnly />);

    expect(screen.queryByRole("button", { name: /mark complete/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /start task/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /mark incomplete/i })).not.toBeInTheDocument();
  });

  it("calls updateTaskStatus and optimistically updates when Mark complete is clicked", async () => {
    render(<TaskStatusWidget task={task} phaseColor={phaseColor} />);

    fireEvent.click(screen.getByRole("button", { name: /mark complete/i }));

    // Optimistic update — buttons change immediately
    expect(screen.getByRole("button", { name: /mark incomplete/i })).toBeInTheDocument();

    await waitFor(() =>
      expect(updateTaskStatus).toHaveBeenCalledWith("task-1", "completed")
    );
  });

  it("calls updateTaskStatus when Start task is clicked", async () => {
    render(<TaskStatusWidget task={task} phaseColor={phaseColor} />);

    fireEvent.click(screen.getByRole("button", { name: /start task/i }));

    await waitFor(() =>
      expect(updateTaskStatus).toHaveBeenCalledWith("task-1", "in_progress")
    );
  });

  it("reverts optimistic update and shows error on failure", async () => {
    (updateTaskStatus as jest.Mock).mockResolvedValue({
      success: false,
      error: "Something went wrong.",
    });

    render(<TaskStatusWidget task={task} phaseColor={phaseColor} />);

    fireEvent.click(screen.getByRole("button", { name: /mark complete/i }));

    await waitFor(() =>
      expect(screen.getByText(/failed to update task status/i)).toBeInTheDocument()
    );

    // Status reverted back to not_started
    expect(screen.getByRole("button", { name: /mark complete/i })).toBeInTheDocument();
  });
});
