import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { PlanCalendar } from "@/components/dashboard/PlanCalendar";
import type { PlanTask } from "@/lib/types/plan";

jest.mock("react-calendar", () => ({
  __esModule: true,
  default: ({
    tileContent,
  }: {
    tileContent?: (args: { date: Date; view: string }) => ReactNode;
  }) => (
    <div data-testid="react-calendar-stub">
      {tileContent?.({ date: new Date(), view: "month" })}
    </div>
  ),
}));

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

describe("PlanCalendar", () => {
  it("shows tasks for the selected date by default", () => {
    const today = formatDateKey(new Date());
    const tasks: PlanTask[] = [
      {
        id: "task-1",
        title: "Visit the bank",
        description: null,
        phase: "before_arrival",
        status: "in_progress",
        due_date: today,
        content_url: "https://notion.so/bank",
        display_order: 1,
        completed_at: null,
      },
    ];

    render(<PlanCalendar tasks={tasks} />);

    expect(screen.getByText("Visit the bank")).toBeInTheDocument();
    expect(screen.getByText("In progress")).toBeInTheDocument();
  });

  it("shows an empty state when no tasks match the selected date", () => {
    render(<PlanCalendar tasks={[]} />);

    expect(
      screen.getByText("No tasks scheduled for this date.")
    ).toBeInTheDocument();
  });
});
