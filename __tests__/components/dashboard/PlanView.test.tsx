import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { PlanView } from "@/components/dashboard/PlanView";
import type { PlanPhaseGroup } from "@/lib/types/plan";

jest.mock("../../../lib/actions/plan", () => ({
  updateTaskStatus: jest.fn(),
}));

jest.mock("../../../components/dashboard/PlanCalendar", () => ({
  PlanCalendar: ({ tasks }: { tasks: unknown[] }) => (
    <div data-testid="plan-calendar-stub">Calendar {tasks.length}</div>
  ),
}));

import { updateTaskStatus } from "../../../lib/actions/plan";

const phaseGroups: PlanPhaseGroup[] = [
  {
    phase: "before_arrival",
    label: "Before Arrival",
    color: "#4ECBA5",
    completedCount: 1,
    totalCount: 2,
    tasks: [
      {
        id: "task-1",
        title: "Open a bank account",
        description: null,
        phase: "before_arrival",
        status: "completed",
        due_date: "2099-09-01",
        content_url: null,
        display_order: 1,
        completed_at: "2026-04-21T00:00:00.000Z",
      },
      {
        id: "task-2",
        title: "Submit housing form",
        description: null,
        phase: "before_arrival",
        status: "in_progress",
        due_date: "2099-09-02",
        content_url: null,
        display_order: 2,
        completed_at: null,
      },
    ],
  },
];

describe("PlanView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (updateTaskStatus as jest.Mock).mockResolvedValue({ success: true });
  });

  it("renders the greeting, progress ring, and calendar", () => {
    render(
      <PlanView
        greeting="Good morning, Alice."
        subtitle="Here's your UStart plan."
        initialPhaseGroups={phaseGroups}
        intakeCompletedAt="2026-04-21T00:00:00.000Z"
      />
    );

    expect(screen.getByText("Good morning, Alice.")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByTestId("plan-calendar-stub")).toBeInTheDocument();
    expect(screen.getByText("Not started")).toBeInTheDocument();
    expect(screen.getAllByText("In progress").length).toBeGreaterThan(0);
    expect(screen.getByText("Done")).toBeInTheDocument();
    expect(
      screen.getByText("Click a task to update its status")
    ).toBeInTheDocument();
  });

  it("updates phase progress and overall progress optimistically", async () => {
    render(
      <PlanView
        greeting="Good morning, Alice."
        subtitle="Here's your UStart plan."
        initialPhaseGroups={phaseGroups}
        intakeCompletedAt="2026-04-21T00:00:00.000Z"
      />
    );

    expect(screen.getByText("1/2 tasks")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: /submit housing form status in_progress/i,
      })
    );

    expect(screen.getByText("2/2 tasks")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();

    await waitFor(() =>
      expect(updateTaskStatus).toHaveBeenCalledWith("task-2", "completed")
    );
  });

  it("hides editing controls in read-only mode", () => {
    render(
      <PlanView
        greeting="Alice's Plan"
        subtitle="Read-only view."
        initialPhaseGroups={phaseGroups}
        intakeCompletedAt="2026-04-21T00:00:00.000Z"
        readOnly
      />
    );

    expect(screen.queryByText("50%")).not.toBeInTheDocument();
    expect(screen.queryByText("Not started")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Click a task to update its status")
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("plan-calendar-stub")).toBeInTheDocument();
  });
});
