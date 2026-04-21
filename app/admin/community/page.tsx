// Admin community page — lists all students who have agreed to community rules.
// Includes a CSV export button for the WhatsApp group admin workflow.

import { fetchCommunityMembers } from "@/lib/admin/data";
import { CommunityExportButton } from "@/components/admin/CommunityExportButton";

export default async function AdminCommunityPage() {
  const members = await fetchCommunityMembers();

  return (
    <div className="px-8 py-8 max-w-5xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="mb-1 font-primary text-2xl font-extrabold tracking-[-0.02em] text-[var(--text)]">
            Community
          </h1>
          <p className="text-[13px] text-[var(--text-muted)]">
            {members.length} member{members.length !== 1 ? "s" : ""} have agreed to community rules
          </p>
        </div>
        <CommunityExportButton members={members} />
      </div>

      {members.length === 0 ? (
        <p className="text-[13px] text-[var(--text-muted)]">No community members yet.</p>
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-white">
          <table className="w-full">
            <thead>
              <tr className="bg-[var(--bg-subtle)] text-[var(--text-muted)]">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">University</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Agreed</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m, i) => (
                <tr
                  key={m.id}
                  className={`${i < members.length - 1 ? "border-b border-[var(--border)]" : ""} transition-colors hover:bg-[var(--bg-subtle)]`}
                >
                  <td className="px-4 py-3 text-[13px] text-[var(--text)]">{m.email}</td>
                  <td className="px-4 py-3 text-[13px] text-[var(--text-mid)]">
                    {[m.first_name, m.last_name].filter(Boolean).join(" ") || "—"}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-[var(--text-muted)]">{m.university_name ?? "—"}</td>
                  <td className="px-4 py-3 text-[13px] text-[var(--text-muted)]">{m.phone_number ?? "—"}</td>
                  <td className="px-4 py-3 text-[13px] text-[var(--text-muted)]">
                    {new Date(m.agreed_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
