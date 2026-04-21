import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { IntakeForm } from "@/app/intake/IntakeForm";

const mockPush = jest.fn();
const mockSubmitIntake = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({ push: mockPush })),
}));

jest.mock("../../../lib/actions/intake", () => ({
  submitIntake: (...args: unknown[]) => mockSubmitIntake(...args),
}));

describe("IntakeForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders without error", () => {
    const { container } = render(<IntakeForm />);
    expect(container).toBeTruthy();
  });

  it("renders all primary fields", () => {
    render(<IntakeForm />);
    expect(screen.getByLabelText(/where are you studying/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/which city/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/when did you arrive, or when will you arrive in the us/i)
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/when do you graduate/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /build my plan/i })).toBeInTheDocument();
  });

  it("shows field errors when required values are missing", async () => {
    render(<IntakeForm />);

    fireEvent.click(screen.getByRole("button", { name: /build my plan/i }));

    expect(await screen.findByText(/please enter your school/i)).toBeInTheDocument();
    expect(screen.getByText(/please enter your city/i)).toBeInTheDocument();
    expect(screen.getByText(/select at least one concern/i)).toBeInTheDocument();
    expect(mockSubmitIntake).not.toHaveBeenCalled();
  });

  it("reveals and hides the other concern input", () => {
    render(<IntakeForm />);

    fireEvent.click(screen.getByLabelText(/^other$/i));
    expect(screen.getByPlaceholderText(/tell us more/i)).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(/^other$/i));
    expect(screen.queryByPlaceholderText(/tell us more/i)).not.toBeInTheDocument();
  });

  it("requires the other concern detail when other is selected", async () => {
    render(<IntakeForm />);

    fireEvent.change(screen.getByLabelText(/where are you studying/i), {
      target: { value: "University of Michigan" },
    });
    fireEvent.change(screen.getByLabelText(/which city/i), {
      target: { value: "Ann Arbor, MI" },
    });
    fireEvent.change(
      screen.getByLabelText(/when did you arrive, or when will you arrive in the us/i),
      {
      target: { value: "2099-09-01" },
      }
    );
    fireEvent.change(screen.getByLabelText(/when do you graduate/i), {
      target: { value: "2103-05-15" },
    });
    fireEvent.click(screen.getByLabelText(/^other$/i));
    fireEvent.click(screen.getByRole("button", { name: /build my plan/i }));

    expect(await screen.findByText(/tell us more about your other concern/i)).toBeInTheDocument();
    expect(mockSubmitIntake).not.toHaveBeenCalled();
  });

  it("shows a building state and then redirects to /dashboard after the minimum build delay", async () => {
    jest.useFakeTimers();
    mockSubmitIntake.mockResolvedValue({ success: true });
    render(<IntakeForm />);

    fireEvent.change(screen.getByLabelText(/where are you studying/i), {
      target: { value: "University of Michigan" },
    });
    fireEvent.change(screen.getByLabelText(/which city/i), {
      target: { value: "Ann Arbor, MI" },
    });
    fireEvent.change(
      screen.getByLabelText(/when did you arrive, or when will you arrive in the us/i),
      {
      target: { value: "2099-09-01" },
      }
    );
    fireEvent.change(screen.getByLabelText(/when do you graduate/i), {
      target: { value: "2103-05-15" },
    });
    fireEvent.click(screen.getByLabelText(/banking & credit/i));
    fireEvent.click(screen.getByRole("button", { name: /build my plan/i }));

    await waitFor(() => {
      expect(mockSubmitIntake).toHaveBeenCalledWith(
        expect.objectContaining({
          school: "University of Michigan",
          city: "Ann Arbor, MI",
          arrival_date: "2099-09-01",
          graduation_date: "2103-05-15",
          main_concerns: ["banking_credit"],
        })
      );
    });
    expect(screen.getByText(/building your plan/i)).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(2400);
    });

    expect(mockPush).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(100);
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
    jest.useRealTimers();
  });

  it("shows a general error when the server action fails", async () => {
    mockSubmitIntake.mockResolvedValue({
      success: false,
      error: "Insert failed",
    });
    render(<IntakeForm />);

    fireEvent.change(screen.getByLabelText(/where are you studying/i), {
      target: { value: "University of Michigan" },
    });
    fireEvent.change(screen.getByLabelText(/which city/i), {
      target: { value: "Ann Arbor, MI" },
    });
    fireEvent.change(
      screen.getByLabelText(/when did you arrive, or when will you arrive in the us/i),
      {
      target: { value: "2099-09-01" },
      }
    );
    fireEvent.change(screen.getByLabelText(/when do you graduate/i), {
      target: { value: "2103-05-15" },
    });
    fireEvent.click(screen.getByLabelText(/banking & credit/i));
    fireEvent.click(screen.getByRole("button", { name: /build my plan/i }));

    expect(await screen.findByText("Insert failed")).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
