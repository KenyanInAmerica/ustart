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

const internalTask: PlanTask = {
  ...task,
  content_url: "/dashboard/content/lite/banking-basics",
};

const noContentTask: PlanTask = {
  ...task,
  content_url: null,
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

  it("calls onToggle with the next status when the status button is clicked", async () => {
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

  // --- Content link ---

  it("renders a View Content link for external content_url", () => {
    render(
      <TaskCard
        task={task}
        phaseColor={phaseColor}
        status={task.status}
        onToggle={onToggle}
      />
    );
    const link = screen.getByRole("link", { name: /view content/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "https://notion.so/task");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("appends ?from=plan for internal content_url", () => {
    render(
      <TaskCard
        task={internalTask}
        phaseColor={phaseColor}
        status={task.status}
        onToggle={onToggle}
      />
    );
    expect(screen.getByRole("link", { name: /view content/i })).toHaveAttribute(
      "href",
      "/dashboard/content/lite/banking-basics?from=plan"
    );
  });

  it("does not render a View Content link when content_url is null", () => {
    render(
      <TaskCard
        task={noContentTask}
        phaseColor={phaseColor}
        status={task.status}
        onToggle={onToggle}
      />
    );
    expect(screen.queryByRole("link", { name: /view content/i })).not.toBeInTheDocument();
  });

  it("does not call onToggle when the View Content link is clicked", () => {
    render(
      <TaskCard
        task={task}
        phaseColor={phaseColor}
        status={task.status}
        onToggle={onToggle}
      />
    );

    fireEvent.click(screen.getByRole("link", { name: /view content/i }));

    expect(onToggle).not.toHaveBeenCalled();
  });

  it("renders as read only — no toggle button, content link still shows", () => {
    render(
      <TaskCard
        task={task}
        phaseColor={phaseColor}
        status={task.status}
        onToggle={onToggle}
        readOnly
      />
    );

    expect(
      screen.queryByRole("button", { name: /open a bank account status not_started/i })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view content/i })).toBeInTheDocument();
  });
});
