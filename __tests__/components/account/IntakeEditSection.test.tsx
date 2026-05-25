import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { IntakeEditSection } from "@/components/account/IntakeEditSection";

jest.mock("../../../lib/actions/intake", () => ({
  updateIntake: jest.fn(),
}));

jest.mock("../../../lib/actions/plan", () => ({
  recalculatePlanDueDates: jest.fn(),
}));

import { updateIntake } from "../../../lib/actions/intake";
import { recalculatePlanDueDates } from "../../../lib/actions/plan";

const mockUpdateIntake = updateIntake as jest.Mock;
const mockRecalculate = recalculatePlanDueDates as jest.Mock;

const baseData = {
  school: "University of Michigan",
  city: "Ann Arbor, MI",
  arrival_date: "2099-09-01",
  graduation_date: "1_to_2_years",
  main_concerns: "banking_credit,other: local banking setup",
};

describe("IntakeEditSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdateIntake.mockResolvedValue({ success: true, arrivalDateChanged: false });
  });

  it("renders with the current school and city pre-filled", () => {
    render(<IntakeEditSection currentData={baseData} />);
    expect(
      (screen.getByLabelText(/school/i) as HTMLInputElement).value
    ).toBe("University of Michigan");
    expect(
      (screen.getByLabelText(/city/i) as HTMLInputElement).value
    ).toBe("Ann Arbor, MI");
  });

  it("pre-selects the saved graduation timeline", () => {
    render(<IntakeEditSection currentData={baseData} />);
    const select = screen.getByLabelText(/graduation timeline/i) as HTMLSelectElement;
    expect(select.value).toBe("1_to_2_years");
  });

  it("pre-checks saved main concern checkboxes and fills other concern text", () => {
    render(<IntakeEditSection currentData={baseData} />);
    expect(
      (screen.getByRole("checkbox", { name: /banking & credit/i }) as HTMLInputElement).checked
    ).toBe(true);
    expect(
      (screen.getByRole("checkbox", { name: /other/i }) as HTMLInputElement).checked
    ).toBe(true);
    expect(
      (screen.getByPlaceholderText(/tell us more/i) as HTMLInputElement).value
    ).toBe("local banking setup");
  });

  // ── isDirty ────────────────────────────────────────────────────────────────

  it("Save changes button is disabled when no fields have changed", () => {
    render(<IntakeEditSection currentData={baseData} />);
    expect(screen.getByRole("button", { name: /save changes/i })).toBeDisabled();
  });

  it("Save changes button is enabled after changing a field", () => {
    render(<IntakeEditSection currentData={baseData} />);
    fireEvent.change(screen.getByLabelText(/school/i), {
      target: { value: "Michigan State" },
    });
    expect(screen.getByRole("button", { name: /save changes/i })).not.toBeDisabled();
  });

  // ── Save and success messages ──────────────────────────────────────────────

  it("calls updateIntake with updated fields when Save changes is clicked", async () => {
    render(<IntakeEditSection currentData={baseData} />);

    fireEvent.change(screen.getByLabelText(/school/i), {
      target: { value: "Michigan State" },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    });

    await waitFor(() =>
      expect(mockUpdateIntake).toHaveBeenCalledWith(
        expect.objectContaining({ school: "Michigan State" })
      )
    );
  });

  it("shows an error message when updateIntake returns an error", async () => {
    mockUpdateIntake.mockResolvedValue({ success: false, error: "Something went wrong." });

    render(<IntakeEditSection currentData={baseData} />);
    fireEvent.change(screen.getByLabelText(/school/i), {
      target: { value: "New School" },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    });

    await waitFor(() =>
      expect(screen.getByText("Something went wrong.")).toBeInTheDocument()
    );
  });

  it("shows 'Profile updated.' when save succeeds without arrivalDateChanged", async () => {
    render(<IntakeEditSection currentData={baseData} />);
    fireEvent.change(screen.getByLabelText(/school/i), {
      target: { value: "Michigan State" },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    });

    await waitFor(() =>
      expect(screen.getByText(/profile updated/i)).toBeInTheDocument()
    );
  });

  it("auto-dismisses the success message after 3 seconds", async () => {
    jest.useFakeTimers();
    render(<IntakeEditSection currentData={baseData} />);
    fireEvent.change(screen.getByLabelText(/school/i), { target: { value: "MIT" } });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    });

    await waitFor(() =>
      expect(screen.getByText(/profile updated/i)).toBeInTheDocument()
    );

    act(() => { jest.advanceTimersByTime(3000); });

    expect(screen.queryByText(/profile updated/i)).not.toBeInTheDocument();
    jest.useRealTimers();
  });

  // ── Arrival date → recalculate prompt ─────────────────────────────────────

  it("calls updateIntake immediately (no warning) when arrival date changes", async () => {
    mockUpdateIntake.mockResolvedValue({ success: true, arrivalDateChanged: true });

    render(<IntakeEditSection currentData={baseData} />);

    fireEvent.change(screen.getByLabelText(/arrival date/i), {
      target: { value: "2100-01-01" },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    });

    await waitFor(() => expect(mockUpdateIntake).toHaveBeenCalled());
    expect(screen.queryByText(/continue/i)).not.toBeInTheDocument();
  });

  it("shows the recalculate prompt when arrivalDateChanged is true after save", async () => {
    mockUpdateIntake.mockResolvedValue({ success: true, arrivalDateChanged: true });

    render(<IntakeEditSection currentData={baseData} />);

    fireEvent.change(screen.getByLabelText(/arrival date/i), {
      target: { value: "2100-01-01" },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    });

    await waitFor(() =>
      expect(
        screen.getByText(/would you like to recalculate them/i)
      ).toBeInTheDocument()
    );
  });

  it("calls recalculatePlanDueDates and shows 'Due dates updated.' on success", async () => {
    mockUpdateIntake.mockResolvedValue({ success: true, arrivalDateChanged: true });
    mockRecalculate.mockResolvedValue({ success: true, updatedCount: 3 });

    render(<IntakeEditSection currentData={baseData} />);

    fireEvent.change(screen.getByLabelText(/arrival date/i), {
      target: { value: "2100-01-01" },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    });

    await waitFor(() =>
      screen.getByRole("button", { name: /recalculate due dates/i })
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /recalculate due dates/i }));
    });

    await waitFor(() =>
      expect(screen.getByText(/due dates updated/i)).toBeInTheDocument()
    );
    expect(mockRecalculate).toHaveBeenCalled();
  });

  it("shows an error when recalculatePlanDueDates fails", async () => {
    mockUpdateIntake.mockResolvedValue({ success: true, arrivalDateChanged: true });
    mockRecalculate.mockResolvedValue({ success: false, error: "Recalc failed." });

    render(<IntakeEditSection currentData={baseData} />);

    fireEvent.change(screen.getByLabelText(/arrival date/i), {
      target: { value: "2100-01-01" },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    });

    await waitFor(() =>
      screen.getByRole("button", { name: /recalculate due dates/i })
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /recalculate due dates/i }));
    });

    await waitFor(() =>
      expect(screen.getByText("Recalc failed.")).toBeInTheDocument()
    );
  });

  it("dismisses the recalculate prompt when 'Keep existing dates' is clicked", async () => {
    mockUpdateIntake.mockResolvedValue({ success: true, arrivalDateChanged: true });

    render(<IntakeEditSection currentData={baseData} />);

    fireEvent.change(screen.getByLabelText(/arrival date/i), {
      target: { value: "2100-01-01" },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /save changes/i }));
    });

    await waitFor(() =>
      screen.getByRole("button", { name: /keep existing dates/i })
    );

    fireEvent.click(screen.getByRole("button", { name: /keep existing dates/i }));

    expect(
      screen.queryByText(/would you like to recalculate them/i)
    ).not.toBeInTheDocument();
  });

  // ── Concern toggling ───────────────────────────────────────────────────────

  it("deselecting 'other' concern clears the other text field", () => {
    render(<IntakeEditSection currentData={baseData} />);
    const otherCheckbox = screen.getByRole("checkbox", { name: /other/i });
    expect(
      (screen.getByPlaceholderText(/tell us more/i) as HTMLInputElement).value
    ).toBe("local banking setup");

    fireEvent.click(otherCheckbox);

    expect(screen.queryByPlaceholderText(/tell us more/i)).not.toBeInTheDocument();
  });

  it("updating the other concern text field changes its value", () => {
    render(<IntakeEditSection currentData={baseData} />);
    const otherInput = screen.getByPlaceholderText(/tell us more/i) as HTMLInputElement;
    fireEvent.change(otherInput, { target: { value: "different concern" } });
    expect(otherInput.value).toBe("different concern");
  });

  it("changing city and graduation date updates the fields", () => {
    render(<IntakeEditSection currentData={baseData} />);

    const cityInput = screen.getByLabelText(/city/i) as HTMLInputElement;
    fireEvent.change(cityInput, { target: { value: "Boston, MA" } });
    expect(cityInput.value).toBe("Boston, MA");

    const gradSelect = screen.getByLabelText(/graduation timeline/i) as HTMLSelectElement;
    fireEvent.change(gradSelect, { target: { value: "3_to_4_years" } });
    expect(gradSelect.value).toBe("3_to_4_years");
  });
});
