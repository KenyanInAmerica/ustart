import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DocumentUpload } from "@/components/documents/DocumentUpload";

jest.mock("../../../lib/actions/documents", () => ({
  submitDocument: jest.fn(),
}));

import { submitDocument } from "../../../lib/actions/documents";

function uploadFile(file: File) {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  fireEvent.change(input, { target: { files: [file] } });
}

describe("DocumentUpload", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (submitDocument as jest.Mock).mockResolvedValue({
      success: true,
      submissionId: "submission-1",
    });
  });

  it("renders the default dropzone", () => {
    render(<DocumentUpload />);

    expect(screen.getByText(/drop files here or click to upload/i)).toBeInTheDocument();
    expect(screen.getByText(/maximum 5 files/i)).toBeInTheDocument();
  });

  it("shows selected files and submits them", async () => {
    render(
      <DocumentUpload
        taskId="task-1"
        templateId="template-1"
        sectionLabel="Banking"
      />
    );

    uploadFile(new File(["pdf"], "bank.pdf", { type: "application/pdf" }));

    expect(screen.getByText("bank.pdf")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /upload 1 file/i }));

    await waitFor(() =>
      expect(submitDocument).toHaveBeenCalledWith(expect.any(FormData))
    );
    const formData = (submitDocument as jest.Mock).mock.calls[0][0] as FormData;
    expect(formData.get("taskId")).toBe("task-1");
    expect(formData.get("templateId")).toBe("template-1");
    expect(formData.get("sectionLabel")).toBe("Banking");
    expect(formData.getAll("files")).toHaveLength(1);
    expect(await screen.findByText(/documents submitted successfully/i)).toBeInTheDocument();
  });

  it("validates rejected file types", () => {
    render(<DocumentUpload />);

    uploadFile(new File(["x"], "script.sh", { type: "text/x-shellscript" }));

    expect(screen.getByText(/not an accepted file type/i)).toBeInTheDocument();
  });
});
