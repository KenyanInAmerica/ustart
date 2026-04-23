import { render, screen } from "@testing-library/react";
import ParentContentPage from "@/app/dashboard/parent/content/page";

jest.mock("../../../../../lib/dashboard/parent", () => ({
  fetchParentStudentContext: jest.fn(),
}));

jest.mock("../../../../../components/dashboard/ContentCards", () => ({
  ContentCards: () => <div data-testid="parent-content-cards-stub" />,
}));

import { fetchParentStudentContext } from "../../../../../lib/dashboard/parent";

describe("ParentContentPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetchParentStudentContext as jest.Mock).mockResolvedValue({
      studentId: "student-1",
      studentFirstName: "Alice",
      studentLastName: "Student",
      shareTasks: true,
      shareCalendar: true,
      shareContent: true,
      membershipTier: "explore",
      membershipRank: 2,
    });
  });

  it("renders the reusable content cards when content is shared", async () => {
    render(await ParentContentPage());

    expect(screen.getByRole("heading", { name: /alice's content/i })).toBeInTheDocument();
    expect(screen.getByTestId("parent-content-cards-stub")).toBeInTheDocument();
  });

  it("shows the friendly message when content is not shared", async () => {
    (fetchParentStudentContext as jest.Mock).mockResolvedValue({
      studentId: "student-1",
      studentFirstName: "Alice",
      studentLastName: "Student",
      shareTasks: true,
      shareCalendar: true,
      shareContent: false,
      membershipTier: "explore",
      membershipRank: 2,
    });

    render(await ParentContentPage());

    expect(
      screen.getByText("Alice hasn't shared their content with you yet.")
    ).toBeInTheDocument();
  });
});
