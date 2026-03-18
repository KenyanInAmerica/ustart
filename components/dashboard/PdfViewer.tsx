// Full-screen PDF viewer modal — uses a native browser iframe pointed at
// /api/pdf so the browser renders the PDF without a JS rendering library.
// The API route handles auth, entitlement, and watermarking before streaming
// the bytes; the iframe receives a plain binary PDF response.
//
// NOTE: browser native PDF toolbar may show a download button depending on
// the browser. #toolbar=0 suppresses it in most browsers but is not guaranteed.
// If hard download prevention is required in future, consider migrating back
// to a controlled viewer like react-pdf or a hosted solution.
"use client";
import { useState, useEffect } from "react";

interface PdfViewerProps {
  contentItemId: string;
  title: string;
  onClose: () => void;
}

export function PdfViewer({ contentItemId, title, onClose }: PdfViewerProps) {
  const [loaded, setLoaded] = useState(false);

  // Close on Escape key press.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // #toolbar=0 is a PDF open parameter supported by most browsers' built-in
  // viewers (Chrome, Firefox, Safari) that hides the toolbar/download button.
  const src = `/api/pdf?content_item_id=${encodeURIComponent(contentItemId)}#toolbar=0`;

  return (
    // Backdrop — clicking outside the card closes the modal.
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Card — stopPropagation prevents backdrop click from firing inside */}
      <div
        className="bg-[#0C1220] border border-white/[0.10] rounded-2xl flex flex-col w-full max-w-3xl h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07] shrink-0">
          <h2 className="font-syne font-semibold text-[14px] text-white truncate max-w-[80%]">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors"
            aria-label="Close viewer"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* PDF area — relative container so spinner overlays the iframe */}
        <div className="flex-1 min-h-0 relative rounded-b-2xl overflow-hidden">
          {/* Spinner shown until the iframe's onLoad fires */}
          {!loaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0C1220] z-10 gap-3">
              <svg
                className="w-7 h-7 animate-spin text-white/10"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  className="opacity-20"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  className="opacity-80"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v2a6 6 0 00-6 6H4z"
                />
              </svg>
              <span className="text-white/40 text-xs font-dm-sans">
                Loading document...
              </span>
            </div>
          )}
          <iframe
            src={src}
            title={title}
            className="w-full h-full border-0 block"
            onLoad={() => setLoaded(true)}
          />
        </div>
      </div>
    </div>
  );
}