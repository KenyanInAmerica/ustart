import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import DashboardPage from "@/app/dashboard/page";

const mockPlanView = jest.fn();

jest.mock("../../../components/dashboard/PlanView", () => ({
  PlanView: (props: {
    greeting: string;
    subtitle: string;
    intakeCompletedAt: string | null;
    initialPhaseGroups: unknown[];
    children?: ReactNode;
  }) => {
    mockPlanView(props);
    return (
      <div>
        <div data-testid="plan-view-stub">{props.greeting}</div>
        {props.children}
      </div>
    );
  },
}));

jest.mock("../../../components/dashboard/ParentInvitationWrapper", () => ({
  ParentInvitationWrapper: () => <div data-testid="parent-invitation-stub" />,
}));

jest.mock("../../../lib/dashboard/plan", () => ({
  fetchUserPlan: jest.fn(),
}));

const mockGetUser = jest.fn();
const mockProfileMaybeSingle = jest.fn();

jest.mock("../../../lib/supabase/server", () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          maybeSingle: mockProfileMaybeSingle,
        })),
      })),
    })),
  })),
}));

import { fetchUserPlan } from "../../../lib/dashboard/plan";
import { redirect } from "next/navigation";

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

describe("DashboardPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    mockProfileMaybeSingle.mockResolvedValue({
      data: {
        first_name: "Alice",
        intake_completed_at: "2026-04-21T00:00:00.000Z",
        role: "student",
      },
    });
    (fetchUserPlan as jest.Mock).mockResolvedValue([
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
            status: "not_started",
            due_date: "2099-09-01",
            content_url: null,
            display_order: 1,
            completed_at: null,
          },
        ],
      },
    ]);
  });

  it("renders without error", async () => {
    const { container } = render(await DashboardPage());
    expect(container).toBeTruthy();
  });

  it("passes greeting and plan data into PlanView", async () => {
    render(await DashboardPage());

    expect(screen.getByTestId("plan-view-stub")).toHaveTextContent(/good/i);
    expect(mockPlanView).toHaveBeenCalledWith(
      expect.objectContaining({
        subtitle: "Here's your UStart plan.",
        intakeCompletedAt: "2026-04-21T00:00:00.000Z",
        initialPhaseGroups: expect.arrayContaining([
          expect.objectContaining({ label: "Before Arrival" }),
        ]),
      })
    );
  });

  it("renders the ParentInvitation component inside PlanView", async () => {
    render(await DashboardPage());
    expect(screen.getByTestId("parent-invitation-stub")).toBeInTheDocument();
  });

  it("redirects parent users to the parent plan", async () => {
    mockProfileMaybeSingle.mockResolvedValue({
      data: {
        first_name: "Alice",
        intake_completed_at: "2026-04-21T00:00:00.000Z",
        role: "parent",
      },
    });

    await DashboardPage();

    expect(redirect).toHaveBeenCalledWith("/dashboard/parent/plan");
  });
});
