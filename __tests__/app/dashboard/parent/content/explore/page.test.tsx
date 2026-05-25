import { render, screen } from "@testing-library/react";
import ParentExploreContentPage from "@/app/dashboard/parent/content/explore/page";

jest.mock("../../../../../../lib/dashboard/parent", () => ({
  fetchParentStudentContext: jest.fn(),
}));

jest.mock("../../../../../../lib/notion/fetcher", () => ({
  getNotionChildPages: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

import { redirect } from "next/navigation";
import { fetchParentStudentContext } from "../../../../../../lib/dashboard/parent";
import { getNotionChildPages } from "../../../../../../lib/notion/fetcher";

const mockContext = {
  studentId: "student-1",
  studentFirstName: "Alice",
  studentLastName: "Student",
  shareTasks: true,
  shareCalendar: true,
  shareContent: true,
  membershipTier: "explore",
  membershipRank: 2,
};

describe("ParentExploreContentPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetchParentStudentContext as jest.Mock).mockResolvedValue(mockContext);
    (getNotionChildPages as jest.Mock).mockResolvedValue([
      { id: "page-1", slug: "intro-to-explore", title: "Intro to Explore" },
    ]);
  });

  it("redirects to the first module when modules exist", async () => {
    await ParentExploreContentPage();
    expect(redirect).toHaveBeenCalledWith(
      "/dashboard/parent/content/explore/intro-to-explore"
    );
  });

  it("shows 'Content coming soon' when no modules exist", async () => {
    (getNotionChildPages as jest.Mock).mockResolvedValue([]);

    render(await ParentExploreContentPage() as React.ReactElement);

    expect(screen.getByText("Content coming soon")).toBeInTheDocument();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("redirects when sharing is off", async () => {
    (fetchParentStudentContext as jest.Mock).mockResolvedValue({
      ...mockContext,
      shareContent: false,
    });

    await ParentExploreContentPage();

    expect(redirect).toHaveBeenCalledWith("/dashboard/parent/content");
  });

  it("redirects when the student does not have explore access", async () => {
    (fetchParentStudentContext as jest.Mock).mockResolvedValue({
      ...mockContext,
      membershipRank: 1,
    });

    await ParentExploreContentPage();

    expect(redirect).toHaveBeenCalledWith("/dashboard/parent/content");
  });
});
