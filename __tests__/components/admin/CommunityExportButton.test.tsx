import { render, screen, fireEvent } from "@testing-library/react";
import { CommunityExportButton } from "@/components/admin/CommunityExportButton";
import type { CommunityMember } from "@/types/admin";

const mockMembers: CommunityMember[] = [
  {
    id: "u1",
    email: "alice@example.com",
    first_name: "Alice",
    last_name: "Smith",
    phone_number: "+1234567890",
    university_name: "State University",
    agreed_at: "2026-01-15T10:00:00Z",
  },
  {
    id: "u2",
    email: "bob@example.com",
    first_name: "Bob",
    last_name: null,
    phone_number: null,
    university_name: null,
    agreed_at: "2026-01-20T10:00:00Z",
  },
];

describe("CommunityExportButton", () => {
  it("renders without error", () => {
    const { container } = render(<CommunityExportButton members={[]} />);
    expect(container).toBeTruthy();
  });

  it("renders the export button", () => {
    render(<CommunityExportButton members={mockMembers} />);
    expect(screen.getByRole("button", { name: /export csv/i })).toBeInTheDocument();
  });

  it("disables the button when members list is empty", () => {
    render(<CommunityExportButton members={[]} />);
    expect(screen.getByRole("button", { name: /export csv/i })).toBeDisabled();
  });

  it("enables the button when there are members", () => {
    render(<CommunityExportButton members={mockMembers} />);
    expect(screen.getByRole("button", { name: /export csv/i })).not.toBeDisabled();
  });

  it("triggers a download when clicked", () => {
    // Mock URL.createObjectURL and document.createElement("a").click
    const mockCreateObjectURL = jest.fn(() => "blob:test");
    const mockRevokeObjectURL = jest.fn();
    const mockClick = jest.fn();
    Object.defineProperty(URL, "createObjectURL", { value: mockCreateObjectURL, writable: true });
    Object.defineProperty(URL, "revokeObjectURL", { value: mockRevokeObjectURL, writable: true });

    const originalCreateElement = document.createElement.bind(document);
    jest.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "a") {
        const el = originalCreateElement(tag) as HTMLAnchorElement;
        el.click = mockClick;
        return el;
      }
      return originalCreateElement(tag);
    });

    render(<CommunityExportButton members={mockMembers} />);
    fireEvent.click(screen.getByRole("button", { name: /export csv/i }));

    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();
    expect(mockRevokeObjectURL).toHaveBeenCalled();

    jest.restoreAllMocks();
  });
});
