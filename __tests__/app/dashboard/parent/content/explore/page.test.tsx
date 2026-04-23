import { render, screen } from "@testing-library/react";
import ParentExploreContentPage from "@/app/dashboard/parent/content/explore/page";

jest.mock("../../../../../../lib/dashboard/parent", () => ({
  fetchParentStudentContext: jest.fn(),
}));

jest.mock("../../../../../../lib/dashboard/content", () => ({
  fetchTierContent: jest.fn().mockResolvedValue([]),
}));

jest.mock("../../../../../../components/dashboard/ContentGrid", () => ({
  ContentGrid: () => <div data-testid="content-grid-stub" />,
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

import { redirect } from "next/navigation";
import { fetchParentStudentContext } from "../../../../../../lib/dashboard/parent";

describe("ParentExploreContentPage", () => {
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

  it("renders the view banner and content grid", async () => {
    render(await ParentExploreContentPage());

    expect(screen.getByText("You're viewing Alice's content")).toBeInTheDocument();
    expect(screen.getByTestId("content-grid-stub")).toBeInTheDocument();
  });

  it("redirects when the student does not have access to explore", async () => {
    (fetchParentStudentContext as jest.Mock).mockResolvedValue({
      studentId: "student-1",
      studentFirstName: "Alice",
      studentLastName: "Student",
      shareTasks: true,
      shareCalendar: true,
      shareContent: true,
      membershipTier: "lite",
      membershipRank: 1,
    });

    await ParentExploreContentPage();

    expect(redirect).toHaveBeenCalledWith("/dashboard/parent/content");
  });
});
