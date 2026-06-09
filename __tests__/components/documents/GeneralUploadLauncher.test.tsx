import { fireEvent, render, screen } from "@testing-library/react";
import { GeneralUploadLauncher } from "@/components/documents/GeneralUploadLauncher";

jest.mock("../../../components/documents/GeneralUploadModal", () => ({
  GeneralUploadModal: ({
    isOpen,
    taskId,
    sectionLabel,
  }: {
    isOpen: boolean;
    taskId?: string;
    sectionLabel?: string;
  }) =>
    isOpen ? (
      <div data-testid="general-upload-modal-stub">
        {taskId}:{sectionLabel}
      </div>
    ) : null,
}));

describe("GeneralUploadLauncher", () => {
  it("opens the general upload modal", () => {
    render(<GeneralUploadLauncher />);

    fireEvent.click(screen.getByRole("button", { name: /upload a document/i }));

    expect(screen.getByTestId("general-upload-modal-stub")).toBeInTheDocument();
  });

  it("opens automatically with URL-provided task context", () => {
    render(
      <GeneralUploadLauncher
        initialOpen
        taskId="task-1"
        sectionLabel="Open a bank account"
      />
    );

    expect(screen.getByTestId("general-upload-modal-stub")).toHaveTextContent(
      "task-1:Open a bank account"
    );
  });
});
