// Tests for the react-pdf-backed PdfViewer modal component.
// react-pdf (pdfjs) requires browser canvas APIs — all document/page rendering
// is mocked here so tests run in jsdom without a real PDF worker.

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PdfViewer } from "@/components/dashboard/PdfViewer";

// Stub the pdfjs worker setup — GlobalWorkerOptions is not available in jsdom.
jest.mock("react-pdf", () => {
  const React = require("react");
  return {
    pdfjs: { GlobalWorkerOptions: { workerSrc: "" }, version: "5.0.0" },
    // Document calls onLoadSuccess immediately with a stub pdf object, then
    // renders its children so Page components appear in the tree.
    Document: ({
      children,
      onLoadSuccess,
      loading,
      file,
    }: {
      children: React.ReactNode;
      onLoadSuccess?: (pdf: { numPages: number }) => void;
      loading?: React.ReactNode;
      file: string | null;
    }) => {
      // Simulate async load: show loading first, then content after file is set.
      const [loaded, setLoaded] = React.useState(false);
      React.useEffect(() => {
        if (file) {
          onLoadSuccess?.({ numPages: 3 });
          setLoaded(true);
        }
      }, [file, onLoadSuccess]);
      if (!loaded) return <>{loading}</>;
      return <div data-testid="pdf-document">{children}</div>;
    },
    Page: ({ pageNumber }: { pageNumber: number }) => (
      <div data-testid={`pdf-page-${pageNumber}`} />
    ),
  };
});

// Stub fetch — returns a minimal blob response so the useEffect can create a
// blob URL without hitting the real network.
const mockFetch = jest.fn();
global.fetch = mockFetch;

// URL.createObjectURL / revokeObjectURL are not implemented in jsdom.
const mockCreateObjectURL = jest.fn(() => "blob:mock-url");
const mockRevokeObjectURL = jest.fn();
global.URL.createObjectURL = mockCreateObjectURL;
global.URL.revokeObjectURL = mockRevokeObjectURL;

// ResizeObserver is not implemented in jsdom.
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// window.matchMedia is not implemented in jsdom.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn((query: string) => ({
    matches: query.includes("860px") ? false : false,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  })),
});

const defaultProps = {
  contentItemId: "item-123",
  title: "Test Guide",
  onClose: jest.fn(),
};

describe("PdfViewer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(["%PDF-1.4"], { type: "application/pdf" })),
    });
  });

  it("renders the modal with the correct title", () => {
    render(<PdfViewer {...defaultProps} />);
    expect(screen.getByText("Test Guide")).toBeInTheDocument();
  });

  it("renders the close button", () => {
    render(<PdfViewer {...defaultProps} />);
    expect(screen.getByRole("button", { name: /close viewer/i })).toBeInTheDocument();
  });

  it("shows loading state before fetch completes", () => {
    // Block fetch so loading state is visible.
    mockFetch.mockReturnValue(new Promise(() => {}));
    render(<PdfViewer {...defaultProps} />);
    expect(screen.getByText("Loading document...")).toBeInTheDocument();
  });

  it("renders the Document after fetch succeeds", async () => {
    render(<PdfViewer {...defaultProps} />);
    await waitFor(() =>
      expect(screen.getByTestId("pdf-document")).toBeInTheDocument()
    );
  });

  it("shows an error state when fetch fails", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));
    render(<PdfViewer {...defaultProps} />);
    await waitFor(() =>
      expect(screen.getByText("Failed to load document")).toBeInTheDocument()
    );
  });

  it("shows an error state when fetch returns a non-ok status", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 403 });
    render(<PdfViewer {...defaultProps} />);
    await waitFor(() =>
      expect(screen.getByText("Failed to load document")).toBeInTheDocument()
    );
  });

  it("calls onClose when the close button is clicked", () => {
    render(<PdfViewer {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /close viewer/i }));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the backdrop is clicked", () => {
    render(<PdfViewer {...defaultProps} />);
    fireEvent.click(screen.getByRole("dialog"));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Escape is pressed", () => {
    render(<PdfViewer {...defaultProps} />);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it("fetches the PDF using the correct content item ID", async () => {
    render(<PdfViewer {...defaultProps} />);
    await waitFor(() => expect(mockFetch).toHaveBeenCalled());
    // fetch is called with the URL and an options object containing the AbortSignal.
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("content_item_id=item-123"),
      expect.objectContaining({ signal: expect.anything() })
    );
  });

  it("revokes the blob URL on unmount", async () => {
    const { unmount } = render(<PdfViewer {...defaultProps} />);
    await waitFor(() => expect(mockCreateObjectURL).toHaveBeenCalled());
    unmount();
    expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });

  it("renders pages returned by onLoadSuccess", async () => {
    render(<PdfViewer {...defaultProps} />);
    await waitFor(() =>
      expect(screen.getByTestId("pdf-document")).toBeInTheDocument()
    );
    // Mock Document calls onLoadSuccess with numPages: 3; on mobile (isDesktop: false)
    // only the current page (1) renders.
    expect(screen.getByTestId("pdf-page-1")).toBeInTheDocument();
  });
});
