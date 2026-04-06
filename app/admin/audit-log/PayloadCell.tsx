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
    return <span className="text-white/20 text-[12px]">—</span>;
  }

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-[12px] text-white/40 hover:text-white/70 transition-colors underline underline-offset-2"
      >
        {open ? "hide" : "view"}
      </button>
      {open && (
        <pre className="mt-2 text-[11px] text-white/60 bg-white/[0.03] border border-white/[0.06] rounded p-2 overflow-x-auto max-w-[360px] whitespace-pre-wrap break-all">
          {JSON.stringify(payload, null, 2)}
        </pre>
      )}
    </div>
  );
}
