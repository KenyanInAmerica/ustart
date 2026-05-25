import { render, screen } from "@testing-library/react";
import ParentLiteContentPage from "@/app/dashboard/parent/content/lite/page";

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
  membershipTier: "lite",
  membershipRank: 1,
};

describe("ParentLiteContentPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetchParentStudentContext as jest.Mock).mockResolvedValue(mockContext);
    (getNotionChildPages as jest.Mock).mockResolvedValue([
      { id: "page-1", slug: "welcome-to-ustart", title: "Welcome to UStart" },
      { id: "page-2", slug: "banking-basics", title: "Banking Basics" },
    ]);
  });

  it("redirects to the first module when modules exist", async () => {
    await ParentLiteContentPage();
    expect(redirect).toHaveBeenCalledWith(
      "/dashboard/parent/content/lite/welcome-to-ustart"
    );
  });

  it("shows 'Content coming soon' when no modules exist", async () => {
    (getNotionChildPages as jest.Mock).mockResolvedValue([]);

    render(await ParentLiteContentPage() as React.ReactElement);

    expect(screen.getByText("Content coming soon")).toBeInTheDocument();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("redirects to parent content when sharing is off", async () => {
    (fetchParentStudentContext as jest.Mock).mockResolvedValue({
      ...mockContext,
      shareContent: false,
    });

    await ParentLiteContentPage();

    expect(redirect).toHaveBeenCalledWith("/dashboard/parent/content");
  });

  it("redirects when student does not have lite access", async () => {
    (fetchParentStudentContext as jest.Mock).mockResolvedValue({
      ...mockContext,
      membershipRank: 0,
    });

    await ParentLiteContentPage();

    expect(redirect).toHaveBeenCalledWith("/dashboard/parent/content");
  });
});
