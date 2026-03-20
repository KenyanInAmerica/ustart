import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { ContentUploadForm } from "@/components/admin/ContentUploadForm";

const mockUploadContentItem = jest.fn();

jest.mock("../../../lib/actions/admin/content", () => ({
  uploadContentItem: (...args: unknown[]) => mockUploadContentItem(...args),
  deleteContentItem: jest.fn(),
  getContentPreviewUrl: jest.fn(),
}));

describe("ContentUploadForm", () => {
  beforeEach(() => {
    mockUploadContentItem.mockReset();
  });

  it("renders without error", () => {
    const { container } = render(<ContentUploadForm />);
    expect(container).toBeTruthy();
  });

  it("renders all required fields", () => {
    render(<ContentUploadForm />);
    expect(screen.getByPlaceholderText(/ssn application guide/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/brief description/i)).toBeInTheDocument();
    expect(screen.getByText(/select category/i)).toBeInTheDocument();
    expect(screen.getByText(/choose pdf/i)).toBeInTheDocument();
  });

  it("renders the upload button", () => {
    render(<ContentUploadForm />);
    expect(screen.getByRole("button", { name: /upload/i })).toBeInTheDocument();
  });

  it("shows success message after successful upload", async () => {
    mockUploadContentItem.mockResolvedValue({ success: true });
    render(<ContentUploadForm />);

    const form = screen.getByRole("button", { name: /upload/i }).closest("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText(/uploaded successfully/i)).toBeInTheDocument();
    });
  });

  it("auto-dismisses success message after 3 seconds", async () => {
    jest.useFakeTimers();
    mockUploadContentItem.mockResolvedValue({ success: true });
    render(<ContentUploadForm />);

    const form = screen.getByRole("button", { name: /upload/i }).closest("form")!;
    fireEvent.submit(form);

    await waitFor(() =>
      expect(screen.getByText(/uploaded successfully/i)).toBeInTheDocument()
    );
    act(() => { jest.advanceTimersByTime(3000); });
    expect(screen.queryByText(/uploaded successfully/i)).not.toBeInTheDocument();
    jest.useRealTimers();
  });

  it("shows error message on failure", async () => {
    mockUploadContentItem.mockResolvedValue({ success: false, error: "All fields are required." });
    render(<ContentUploadForm />);

    const form = screen.getByRole("button", { name: /upload/i }).closest("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText("All fields are required.")).toBeInTheDocument();
    });
  });

  it("shows selected filename when a file is chosen", () => {
    render(<ContentUploadForm />);
    const fileInput = screen.getByRole("button", { name: /upload/i })
      .closest("form")!
      .querySelector("input[type='file']")!;

    const file = new File(["content"], "guide.pdf", { type: "application/pdf" });
    Object.defineProperty(fileInput, "files", { value: [file] });
    fireEvent.change(fileInput);

    expect(screen.getByText("guide.pdf")).toBeInTheDocument();
  });
});
