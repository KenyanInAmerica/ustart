"use client";
// Full-screen PDF viewer modal backed by react-pdf.
//
// Flow:
//   1. On mount, fetch /api/pdf?content_item_id=... as a binary blob.
//   2. Create a blob:// URL from the response and hand it to <Document>.
//   3. Revoke the blob URL on unmount to avoid memory leaks.
//
// The raw API URL is never passed to react-pdf directly — that would cause the
// browser to make a second unauthenticated request. Fetching via JS preserves
// any auth cookies/headers that are attached automatically by the browser.
//
// Layout:
//   - Desktop (≥860px): all pages rendered in a scrollable column.
//   - Mobile (<860px): single page at a time with prev/next controls.
//     isDesktop defaults to false; the media query effect fires before numPages
//     is populated, so there is no visible layout flash.

import { useState, useEffect, useCallback, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";

// CDN worker — avoids bundling the heavy pdfjs worker into the app JS bundle.
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PdfViewerProps {
  contentItemId: string;
  title: string;
  onClose: () => void;
}

// Shared spinner SVG used in both the fetch loading state and the Document loading prop.
function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <svg
        className="h-7 w-7 animate-spin text-[var(--text-muted)]"
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
      <span className="text-xs font-primary text-[var(--text-muted)]">
        Loading document...
      </span>
    </div>
  );
}

export function PdfViewer({ contentItemId, title, onClose }: PdfViewerProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState(false);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  // false = mobile layout until media query fires; effect runs before pages appear.
  const [isDesktop, setIsDesktop] = useState(false);
  const [pageWidth, setPageWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch the watermarked PDF as a blob so the API URL is never exposed to
  // react-pdf (which would attempt a second, unauthenticated fetch).
  // AbortController cancels the in-flight request when the effect cleans up.
  // React 18 Strict Mode double-invokes effects in development — without this,
  // two full PDF fetches would fire on every modal open. With it, the first
  // request is aborted before it completes and only the second goes through.
  useEffect(() => {
    const controller = new AbortController();
    let objectUrl = "";
    async function load() {
      try {
        const res = await fetch(
          `/api/pdf?content_item_id=${encodeURIComponent(contentItemId)}`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      } catch (err) {
        // AbortError is expected when the cleanup runs — not a real failure.
        if ((err as Error).name !== "AbortError") setFetchError(true);
      }
    }
    load();
    // Revoke blob URL and abort any in-flight request on unmount / re-run.
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [contentItemId]);

  // Track the rendered container width so Page fills it exactly.
  // ResizeObserver handles window resize and initial measurement.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setPageWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Match the 860px breakpoint used throughout the project (md-900).
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 860px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Close on Escape key.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const onDocumentLoadSuccess = useCallback(
    ({ numPages: n }: { numPages: number }) => {
      setNumPages(n);
    },
    []
  );

  const goToPrev = () => setCurrentPage((p) => Math.max(1, p - 1));
  const goToNext = () => setCurrentPage((p) => Math.min(numPages, p + 1));

  // Desktop: render all pages stacked; mobile: render only the current page.
  const pagesToRender = isDesktop
    ? Array.from({ length: numPages }, (_, i) => i + 1)
    : [currentPage];

  // Subtract horizontal padding (16px each side) from the container width so
  // the page canvas doesn't cause a horizontal scrollbar.
  const resolvedWidth = pageWidth > 32 ? pageWidth - 32 : undefined;

  return (
    // Backdrop — click outside the card to close.
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Card — stopPropagation prevents the backdrop click handler from firing */}
      <div
        className="flex h-[90vh] w-full max-w-3xl flex-col rounded-[var(--radius-lg)] border border-[var(--border)] bg-white shadow-[var(--shadow-lg)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <h2 className="max-w-[80%] truncate font-primary text-[14px] font-semibold text-[var(--text)]">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
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

        {/* PDF content area — scrollable, flex-1 fills remaining modal height */}
        <div
          ref={containerRef}
          className="min-h-0 flex-1 overflow-y-auto rounded-b-[var(--radius-lg)] bg-[var(--bg-subtle)] px-4"
        >
          {/* Fetch loading state */}
          {!blobUrl && !fetchError && <Spinner />}

          {/* Fetch / render error state */}
          {fetchError && (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
              <p className="font-primary text-sm font-semibold text-[var(--text)]">
                Failed to load document
              </p>
              <p className="text-xs font-primary text-[var(--text-muted)]">
                Check your connection and try again.
              </p>
            </div>
          )}

          {/* react-pdf Document — only mounted once the blob URL is ready */}
          {blobUrl && (
            <Document
              file={blobUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={() => setFetchError(true)}
              loading={<Spinner />}
              className="flex flex-col items-center"
            >
              {numPages > 0 &&
                pagesToRender.map((pageNum) => (
                  <div key={pageNum} className="py-2 first:pt-4 last:pb-4">
                    {/* react-pdf renders the page into a <canvas> — inline styles
                        on that canvas element are set by the library and are exempt
                        from the project's Tailwind-only styling convention. */}
                    <Page
                      pageNumber={pageNum}
                      width={resolvedWidth}
                      renderAnnotationLayer={false}
                      renderTextLayer={false}
                    />
                  </div>
                ))}
            </Document>
          )}
        </div>

        {/* Mobile-only prev/next navigation — hidden on desktop via min-[860px]:hidden */}
        {numPages > 1 && (
          <div className="flex shrink-0 items-center justify-between border-t border-[var(--border)] px-5 py-3 min-[860px]:hidden">
            <button
              onClick={goToPrev}
              disabled={currentPage <= 1}
              className="text-xs font-primary text-[var(--text-mid)] transition-colors hover:text-[var(--text)] disabled:cursor-not-allowed disabled:text-[var(--text-muted)]"
            >
              ← Previous
            </button>
            <span className="text-xs font-primary text-[var(--text-muted)]">
              {currentPage} / {numPages}
            </span>
            <button
              onClick={goToNext}
              disabled={currentPage >= numPages}
              className="text-xs font-primary text-[var(--text-mid)] transition-colors hover:text-[var(--text)] disabled:cursor-not-allowed disabled:text-[var(--text-muted)]"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
