"use client";

// Inline expand/collapse for the payload JSON column.
// Collapsed by default; clicking shows formatted JSON below the action row.

import { useState } from "react";

interface PayloadCellProps {
  payload: Record<string, unknown> | null;
}

export function PayloadCell({ payload }: PayloadCellProps) {
  const [open, setOpen] = useState(false);

  if (!payload || Object.keys(payload).length === 0) {
    return <span className="text-[12px] text-[var(--text-muted)]">—</span>;
  }

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-[12px] text-[var(--text-muted)] underline underline-offset-2 transition-colors hover:text-[var(--text)]"
      >
        {open ? "hide" : "view"}
      </button>
      {open && (
        <pre className="mt-2 max-w-[360px] overflow-x-auto whitespace-pre-wrap break-all rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] p-2 font-mono text-xs text-[var(--text-muted)]">
          {JSON.stringify(payload, null, 2)}
        </pre>
      )}
    </div>
  );
}
