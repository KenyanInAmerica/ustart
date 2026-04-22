import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { TaskCard } from "@/components/dashboard/TaskCard";
import type { PlanTask } from "@/lib/types/plan";

const task: PlanTask = {
  id: "task-1",
  title: "Open a bank account",
  description: "Bring your passport and I-20.",
  phase: "before_arrival",
  status: "not_started",
  due_date: "2099-09-01",
  content_url: "https://notion.so/task",
  display_order: 1,
  completed_at: null,
};

describe("TaskCard", () => {
  const onToggle = jest.fn();
  const phaseColor = "#4ECBA5";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders title, due date, and description", () => {
    render(
      <TaskCard
        task={task}
        phaseColor={phaseColor}
        status={task.status}
        onToggle={onToggle}
      />
    );
    expect(screen.getByText("Open a bank account")).toBeInTheDocument();
    expect(screen.getByText(/due sep/i)).toBeInTheDocument();
    expect(screen.getByText("Bring your passport and I-20.")).toBeInTheDocument();
  });

  it("calls onToggle with the next status when clicked", async () => {
    render(
      <TaskCard
        task={task}
        phaseColor={phaseColor}
        status={task.status}
        onToggle={onToggle}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /open a bank account status not_started/i }));

    await waitFor(() =>
      expect(onToggle).toHaveBeenCalledWith("task-1", "in_progress")
    );
  });

  it("cycles from in progress to completed with one click", async () => {
    render(
      <TaskCard
        task={{ ...task, status: "in_progress" }}
        phaseColor={phaseColor}
        status="in_progress"
        onToggle={onToggle}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: /open a bank account status in_progress/i })
    );

    await waitFor(() =>
      expect(onToggle).toHaveBeenCalledWith("task-1", "completed")
    );
  });

  it("cycles from completed to not started with one click", async () => {
    render(
      <TaskCard
        task={{ ...task, status: "completed", completed_at: "2026-04-22T00:00:00.000Z" }}
        phaseColor={phaseColor}
        status="completed"
        onToggle={onToggle}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: /open a bank account status completed/i })
    );

    await waitFor(() =>
      expect(onToggle).toHaveBeenCalledWith("task-1", "not_started")
    );
  });

  it("shows a visible not started status circle", () => {
    const { container } = render(
      <TaskCard
        task={task}
        phaseColor={phaseColor}
        status={task.status}
        onToggle={onToggle}
      />
    );

    expect(container.querySelector(".border-\\[var\\(--border-hi\\)\\]")).toBeInTheDocument();
  });

  it("renders a content link when content_url is present", () => {
    render(
      <TaskCard
        task={task}
        phaseColor={phaseColor}
        status={task.status}
        onToggle={onToggle}
      />
    );
    expect(
      screen.getByRole("link", { name: /open open a bank account resource/i })
    ).toHaveAttribute("href", "https://notion.so/task");
  });

  it("does not toggle status when the content link is clicked", () => {
    render(
      <TaskCard
        task={task}
        phaseColor={phaseColor}
        status={task.status}
        onToggle={onToggle}
      />
    );

    fireEvent.click(
      screen.getByRole("link", { name: /open open a bank account resource/i })
    );

    expect(onToggle).not.toHaveBeenCalled();
  });

  it("toggles when the phase dot area is clicked", async () => {
    render(
      <TaskCard
        task={task}
        phaseColor={phaseColor}
        status={task.status}
        onToggle={onToggle}
      />
    );

    fireEvent.click(screen.getByTestId("task-phase-dot-task-1"));

    await waitFor(() =>
      expect(onToggle).toHaveBeenCalledWith("task-1", "in_progress")
    );
  });
});
