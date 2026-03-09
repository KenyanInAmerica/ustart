import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ProfileSection } from "@/components/account/ProfileSection";

jest.mock("../../../lib/actions/updateProfile", () => ({
  updateProfile: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({ refresh: jest.fn() })),
}));

import { updateProfile } from "../../../lib/actions/updateProfile";
import { useRouter } from "next/navigation";

const baseProps = {
  firstName: "Randy",
  lastName: "Osoti",
  email: "randy@example.com",
  phoneNumber: "+12025551234",
  universityName: "University of Michigan",
  countryOfOrigin: "Kenya",
};

describe("ProfileSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders without error", () => {
    const { container } = render(<ProfileSection {...baseProps} />);
    expect(container).toBeTruthy();
  });

  it("displays the saved first name, last name and email", () => {
    render(<ProfileSection {...baseProps} />);
    expect(screen.getByText("Randy")).toBeInTheDocument();
    expect(screen.getByText("Osoti")).toBeInTheDocument();
    expect(screen.getByText("randy@example.com")).toBeInTheDocument();
  });

  it("displays saved contact fields", () => {
    render(<ProfileSection {...baseProps} />);
    expect(screen.getByText("+12025551234")).toBeInTheDocument();
    expect(screen.getByText("University of Michigan")).toBeInTheDocument();
    expect(screen.getByText("Kenya")).toBeInTheDocument();
  });

  // ── Personal Info ──────────────────────────────────────────────────────────

  it("renders an Edit button for Personal Info", () => {
    render(<ProfileSection {...baseProps} />);
    // Two Edit buttons (one per subsection) — get by surrounding context
    expect(screen.getAllByRole("button", { name: /^edit$/i }).length).toBeGreaterThan(0);
  });

  it("clicking Edit on Personal Info makes the first name input editable", () => {
    render(<ProfileSection {...baseProps} />);
    fireEvent.click(screen.getAllByRole("button", { name: /^edit$/i })[0]);
    expect(screen.getByDisplayValue("Randy")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Osoti")).toBeInTheDocument();
  });

  it("Cancel on Personal Info closes edit mode and reverts the draft", () => {
    render(<ProfileSection {...baseProps} />);
    fireEvent.click(screen.getAllByRole("button", { name: /^edit$/i })[0]);
    fireEvent.change(screen.getByDisplayValue("Randy"), {
      target: { value: "Changed" },
    });
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.getByText("Randy")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("Changed")).not.toBeInTheDocument();
  });

  it("Save on Personal Info calls updateProfile with first_name and last_name", async () => {
    (updateProfile as jest.Mock).mockResolvedValue({ success: true });
    render(<ProfileSection {...baseProps} />);
    fireEvent.click(screen.getAllByRole("button", { name: /^edit$/i })[0]);
    fireEvent.change(screen.getByDisplayValue("Randy"), {
      target: { value: "New" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
    await waitFor(() =>
      expect(updateProfile).toHaveBeenCalledWith({ first_name: "New", last_name: "Osoti" })
    );
  });

  it("calls router.refresh() after a successful Personal Info save", async () => {
    const mockRefresh = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ refresh: mockRefresh });
    (updateProfile as jest.Mock).mockResolvedValue({ success: true });
    render(<ProfileSection {...baseProps} />);
    fireEvent.click(screen.getAllByRole("button", { name: /^edit$/i })[0]);
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
    await waitFor(() => expect(mockRefresh).toHaveBeenCalledTimes(1));
  });

  it("shows a server error in Personal Info when updateProfile fails", async () => {
    (updateProfile as jest.Mock).mockResolvedValue({
      success: false,
      error: "DB error",
    });
    render(<ProfileSection {...baseProps} />);
    fireEvent.click(screen.getAllByRole("button", { name: /^edit$/i })[0]);
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
    expect(await screen.findByText("DB error")).toBeInTheDocument();
  });

  // ── Contact & Background ───────────────────────────────────────────────────

  it("clicking Edit on Contact makes phone and university inputs editable", () => {
    render(<ProfileSection {...baseProps} />);
    // Second Edit button is Contact & Background
    fireEvent.click(screen.getAllByRole("button", { name: /^edit$/i })[1]);
    expect(screen.getByDisplayValue("+12025551234")).toBeInTheDocument();
    expect(screen.getByDisplayValue("University of Michigan")).toBeInTheDocument();
  });

  it("shows a validation error for an invalid phone number on Save", async () => {
    render(<ProfileSection {...baseProps} phoneNumber="" />);
    fireEvent.click(screen.getAllByRole("button", { name: /^edit$/i })[1]);
    // Find the tel input and type an invalid value
    const telInput = screen.getByPlaceholderText("+1 234 567 8900");
    fireEvent.change(telInput, { target: { value: "not-a-phone" } });
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
    expect(
      await screen.findByText(/valid international number/i)
    ).toBeInTheDocument();
    expect(updateProfile).not.toHaveBeenCalled();
  });

  it("calls updateProfile with contact fields on a valid save", async () => {
    (updateProfile as jest.Mock).mockResolvedValue({ success: true });
    render(<ProfileSection {...baseProps} />);
    fireEvent.click(screen.getAllByRole("button", { name: /^edit$/i })[1]);
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
    await waitFor(() =>
      expect(updateProfile).toHaveBeenCalledWith(
        expect.objectContaining({ phone_number: "+12025551234" })
      )
    );
  });

  it("Cancel on Contact reverts all draft contact fields", () => {
    render(<ProfileSection {...baseProps} />);
    fireEvent.click(screen.getAllByRole("button", { name: /^edit$/i })[1]);
    fireEvent.change(screen.getByDisplayValue("+12025551234"), {
      target: { value: "+19999999999" },
    });
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.getByText("+12025551234")).toBeInTheDocument();
  });

  it("email field is always read-only and never becomes an input", () => {
    render(<ProfileSection {...baseProps} />);
    fireEvent.click(screen.getAllByRole("button", { name: /^edit$/i })[0]);
    // Email should not appear as an input, only as text
    expect(screen.queryByDisplayValue("randy@example.com")).not.toBeInTheDocument();
    expect(screen.getByText("randy@example.com")).toBeInTheDocument();
  });

  it("shows Not set placeholder when fields are null", () => {
    render(
      <ProfileSection
        {...baseProps}
        firstName={null}
        lastName={null}
        phoneNumber={null}
        universityName={null}
        countryOfOrigin={null}
      />
    );
    expect(screen.getAllByText("Not set").length).toBeGreaterThan(0);
  });
});
