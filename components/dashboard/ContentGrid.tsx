// Content card grid with inline PDF viewer modal.
// Receives pre-fetched content items from a Server Component parent so this
// client component only needs to manage UI state (which PDF is open).

"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Card } from "@/components/ui/Card";

// PdfViewer sets up the pdfjs worker (a browser-only API) at module evaluation
// time. ssr: false prevents Next.js from bundling or evaluating it on the server.
const PdfViewer = dynamic(
  () => import("@/components/dashboard/PdfViewer").then((m) => m.PdfViewer),
  { ssr: false }
);

export interface ContentGridItem {
  id: string;
  title: string;
  description: string | null;
}

interface ContentGridProps {
  items: ContentGridItem[];
}

export function ContentGrid({ items }: ContentGridProps) {
  const [viewing, setViewing] = useState<ContentGridItem | null>(null);

  if (items.length === 0) {
    return (
      <p className="text-[13px] text-[var(--text-muted)]">
        No content available yet. Check back soon.
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md-900:grid-cols-2 gap-4">
        {items.map((item) => (
          <Card
            key={item.id}
            className="flex flex-col gap-3 border border-[var(--border-md)] bg-white"
            padding="md"
          >
            {/* PDF icon + title row */}
            <div className="flex items-start gap-3">
              <span className="mt-0.5 shrink-0 text-[var(--text-muted)]">
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden="true"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </span>
              <div className="min-w-0">
                <p className="font-primary font-semibold text-[14px] leading-snug text-[var(--text)]">
                  {item.title}
                </p>
                {item.description && (
                  <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--text-muted)]">
                    {item.description}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() => setViewing(item)}
              className="self-start text-[12px] font-semibold text-[var(--accent)] transition-colors hover:underline"
            >
              View PDF
            </button>
          </Card>
        ))}
      </div>

      {viewing && (
        <PdfViewer
          contentItemId={viewing.id}
          title={viewing.title}
          onClose={() => setViewing(null)}
        />
      )}
    </>
  );
}
