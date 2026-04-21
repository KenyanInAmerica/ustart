// Button that exports the community members list as a CSV file.
// Builds the CSV in the browser from the data passed as props — no API call needed.
// Columns: email, first_name, last_name, phone_number, university_name, agreed_at.

"use client";

import { Button } from "@/components/ui/Button";
import type { CommunityMember } from "@/types/admin";

interface CommunityExportButtonProps {
  members: CommunityMember[];
}

export function CommunityExportButton({ members }: CommunityExportButtonProps) {
  function handleExport() {
    const headers = ["email", "first_name", "last_name", "phone_number", "university_name", "agreed_at"];

    // Escape a CSV cell: wrap in quotes if it contains a comma, quote, or newline.
    function escapeCell(value: string | null): string {
      const s = value ?? "";
      if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    }

    const rows = members.map((m) =>
      [m.email, m.first_name, m.last_name, m.phone_number, m.university_name, m.agreed_at]
        .map(escapeCell)
        .join(",")
    );

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `community-members-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button
      onClick={handleExport}
      disabled={members.length === 0}
      variant="secondary"
      size="sm"
    >
      {/* Download icon */}
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      Export CSV
    </Button>
  );
}
