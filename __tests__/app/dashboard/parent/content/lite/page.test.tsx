import { render, screen } from "@testing-library/react";
import ParentLiteContentPage from "@/app/dashboard/parent/content/lite/page";

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

describe("ParentLiteContentPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
  });

  it("renders the view banner and content grid", async () => {
    render(await ParentLiteContentPage());

    expect(screen.getByText("You're viewing Alice's content")).toBeInTheDocument();
    expect(screen.getByTestId("content-grid-stub")).toBeInTheDocument();
  });

  it("redirects to parent content when sharing is off", async () => {
    (fetchParentStudentContext as jest.Mock).mockResolvedValue({
      studentId: "student-1",
      studentFirstName: "Alice",
      studentLastName: "Student",
      shareTasks: true,
      shareCalendar: true,
      shareContent: false,
      membershipTier: "lite",
      membershipRank: 1,
    });

    await ParentLiteContentPage();

    expect(redirect).toHaveBeenCalledWith("/dashboard/parent/content");
  });
});
