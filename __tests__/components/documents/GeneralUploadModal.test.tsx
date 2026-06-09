import { fireEvent, render, screen } from "@testing-library/react";
import { GeneralUploadModal } from "@/components/documents/GeneralUploadModal";

jest.mock("../../../components/documents/DocumentUpload", () => ({
  DocumentUpload: ({
    taskId,
    sectionLabel,
  }: {
    taskId?: string;
    sectionLabel?: string;
  }) => (
    <div data-testid="document-upload-stub">
      {taskId}:{sectionLabel}
    </div>
  ),
}));

describe("GeneralUploadModal", () => {
  it("renders nothing when closed", () => {
    render(<GeneralUploadModal isOpen={false} onClose={jest.fn()} />);

    expect(screen.queryByText(/upload a document/i)).not.toBeInTheDocument();
  });

  it("renders upload content and closes from the close button", () => {
    const onClose = jest.fn();
    render(<GeneralUploadModal isOpen onClose={onClose} />);

    expect(screen.getByRole("heading", { name: /upload a document/i })).toBeInTheDocument();
    expect(screen.getByTestId("document-upload-stub")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /close modal/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("passes task context to DocumentUpload", () => {
    render(
      <GeneralUploadModal
        isOpen
        onClose={jest.fn()}
        taskId="task-1"
        sectionLabel="Open a bank account"
      />
    );

    expect(screen.getByTestId("document-upload-stub")).toHaveTextContent(
      "task-1:Open a bank account"
    );
  });
});
