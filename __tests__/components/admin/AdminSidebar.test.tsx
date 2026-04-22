import { render, screen } from "@testing-library/react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(() => "/admin"),
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));

jest.mock("@supabase/ssr", () => ({
  createBrowserClient: jest.fn(() => ({
    auth: { signOut: jest.fn().mockResolvedValue({}) },
  })),
}));

describe("AdminSidebar", () => {
  it("renders without error", () => {
    const { container } = render(<AdminSidebar />);
    expect(container).toBeTruthy();
  });

  it("renders the UStart wordmark", () => {
    render(<AdminSidebar />);
    expect(screen.getByText("UStart")).toBeInTheDocument();
  });

  it("renders the Admin badge", () => {
    render(<AdminSidebar />);
    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  it("renders all nav items", () => {
    render(<AdminSidebar />);
    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("Users")).toBeInTheDocument();
    expect(screen.getByText("Community")).toBeInTheDocument();
    expect(screen.getByText("Content")).toBeInTheDocument();
    expect(screen.getByText("Plan Templates")).toBeInTheDocument();
    expect(screen.getByText("Admins")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("marks Overview link as active when on /admin exactly", () => {
    render(<AdminSidebar />);
    const overviewLink = screen.getByRole("link", { name: /overview/i });
    expect(overviewLink).toHaveAttribute("href", "/admin");
    expect(overviewLink.className).toMatch(/text-\[#3083DC\]/);
  });

  it("all nav links point to the correct hrefs", () => {
    render(<AdminSidebar />);
    expect(screen.getByRole("link", { name: /users/i })).toHaveAttribute("href", "/admin/users");
    expect(screen.getByRole("link", { name: /community/i })).toHaveAttribute("href", "/admin/community");
    expect(screen.getByRole("link", { name: /content/i })).toHaveAttribute("href", "/admin/content");
    expect(screen.getByRole("link", { name: /plan templates/i })).toHaveAttribute("href", "/admin/plan-templates");
    expect(screen.getByRole("link", { name: /admins/i })).toHaveAttribute("href", "/admin/admins");
    expect(screen.getByRole("link", { name: /settings/i })).toHaveAttribute("href", "/admin/settings");
  });

  it("renders the sign out button", () => {
    render(<AdminSidebar />);
    expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument();
  });
});
