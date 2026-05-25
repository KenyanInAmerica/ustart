import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { PlanTaskAddModal } from "@/components/admin/PlanTaskAddModal";

jest.mock("../../../lib/actions/admin/planTasks", () => ({
  adminAddPlanTask: jest.fn(),
}));

import { adminAddPlanTask } from "../../../lib/actions/admin/planTasks";

const mockAdd = adminAddPlanTask as jest.Mock;

describe("PlanTaskAddModal", () => {
  const onClose = jest.fn();
  const onSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockAdd.mockResolvedValue({ success: true });
  });

  it("renders all form fields", () => {
    render(<PlanTaskAddModal userId="user-1" onClose={onClose} onSave={onSave} />);
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phase/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/content url/i)).toBeInTheDocument();
  });

  it("shows an inline error when title is empty and Add task is clicked", async () => {
    render(<PlanTaskAddModal userId="user-1" onClose={onClose} onSave={onSave} />);

    fireEvent.click(screen.getByRole("button", { name: /add task/i }));

    expect(screen.getByText("Title is required.")).toBeInTheDocument();
    expect(mockAdd).not.toHaveBeenCalled();
  });

  it("calls adminAddPlanTask with the entered fields on submit", async () => {
    render(<PlanTaskAddModal userId="user-1" onClose={onClose} onSave={onSave} />);

    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: "Get SSN" },
    });
    fireEvent.change(screen.getByLabelText(/phase/i), {
      target: { value: "first_7_days" },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /add task/i }));
    });

    await waitFor(() =>
      expect(mockAdd).toHaveBeenCalledWith(
        "user-1",
        expect.objectContaining({
          title: "Get SSN",
          phase: "first_7_days",
        })
      )
    );
  });

  it("calls onSave when adminAddPlanTask succeeds", async () => {
    render(<PlanTaskAddModal userId="user-1" onClose={onClose} onSave={onSave} />);

    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: "Get SSN" },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /add task/i }));
    });

    await waitFor(() => expect(onSave).toHaveBeenCalled());
  });

  it("shows an error message when adminAddPlanTask fails", async () => {
    mockAdd.mockResolvedValue({ success: false, error: "Insert failed." });

    render(<PlanTaskAddModal userId="user-1" onClose={onClose} onSave={onSave} />);

    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: "New task" },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /add task/i }));
    });

    await waitFor(() =>
      expect(screen.getByText("Insert failed.")).toBeInTheDocument()
    );
    expect(onSave).not.toHaveBeenCalled();
  });

  it("calls onClose when the Cancel button is clicked", () => {
    render(<PlanTaskAddModal userId="user-1" onClose={onClose} onSave={onSave} />);
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when the backdrop is clicked", () => {
    render(<PlanTaskAddModal userId="user-1" onClose={onClose} onSave={onSave} />);
    const backdrop = document.querySelector('[aria-hidden="true"]') as HTMLElement;
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalled();
  });

  it("renders the description field", () => {
    render(<PlanTaskAddModal userId="user-1" onClose={onClose} onSave={onSave} />);
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
  });

  it("includes description in the submitted payload when filled in", async () => {
    render(<PlanTaskAddModal userId="user-1" onClose={onClose} onSave={onSave} />);

    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: "Open bank account" },
    });
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: "Bring your I-20 and passport." },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /add task/i }));
    });

    await waitFor(() =>
      expect(mockAdd).toHaveBeenCalledWith(
        "user-1",
        expect.objectContaining({ description: "Bring your I-20 and passport." })
      )
    );
  });

  it("includes content URL in the submitted payload when filled in", async () => {
    render(<PlanTaskAddModal userId="user-1" onClose={onClose} onSave={onSave} />);

    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: "Open bank account" },
    });
    fireEvent.change(screen.getByLabelText(/content url/i), {
      target: { value: "https://notion.so/bank-guide" },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /add task/i }));
    });

    await waitFor(() =>
      expect(mockAdd).toHaveBeenCalledWith(
        "user-1",
        expect.objectContaining({ content_url: "https://notion.so/bank-guide" })
      )
    );
  });
});
