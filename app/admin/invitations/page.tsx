// Admin invitations page — shows all parent invitations and allows manual linking.
// Status filter is driven by URL search params so the current view is shareable.

import { fetchParentInvitations } from "@/lib/admin/data";
import { InvitationLinkForm } from "@/components/admin/InvitationLinkForm";
import Link from "next/link";

interface PageProps {
  searchParams: { status?: string };
}

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "cancelled", label: "Cancelled" },
] as const;

export default async function AdminInvitationsPage({ searchParams }: PageProps) {
  const statusFilter = (searchParams.status as "pending" | "accepted" | "cancelled" | undefined) ?? undefined;
  const invitations = await fetchParentInvitations(statusFilter);

  function statusBadge(status: string) {
    const styles: Record<string, string> = {
      pending: "bg-[#F5C842]/10 text-yellow-700 border-[#F5C842]/30",
      accepted: "bg-[#4ECBA5]/10 text-[#4ECBA5] border-[#4ECBA5]/20",
      cancelled: "bg-[var(--bg-subtle)] text-[var(--text-muted)] border-[var(--border)]",
    };
    return (
      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] capitalize ${styles[status] ?? ""}`}>
        {status}
      </span>
    );
  }

  return (
    <div className="px-8 py-8 max-w-5xl">
      <h1 className="mb-1 font-primary text-2xl font-extrabold tracking-[-0.02em] text-[var(--text)]">
        Parent Invitations
      </h1>
      <p className="mb-8 text-[13px] text-[var(--text-muted)]">
        View and manage parent–student links, or manually link a parent below.
      </p>

      {/* Manual link form */}
      <div className="mb-8 rounded-[var(--radius-lg)] border border-[var(--border)] bg-white px-6 py-5">
        <h2 className="mb-4 text-[13px] font-medium text-[var(--text)]">Manually link a parent</h2>
        <InvitationLinkForm />
      </div>

      {/* Status filter tabs */}
      <div className="mb-5 flex gap-1">
        {STATUS_OPTIONS.map((opt) => {
          const href = opt.value ? `/admin/invitations?status=${opt.value}` : "/admin/invitations";
          const active = (statusFilter ?? "") === opt.value;
          return (
            <Link
              key={opt.value}
              href={href}
              className={`rounded-[var(--radius-sm)] px-3 py-1.5 text-[13px] transition-colors ${
                active
                  ? "bg-[#3083DC]/10 text-[#3083DC]"
                  : "text-[var(--text-mid)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text)]"
              }`}
            >
              {opt.label}
            </Link>
          );
        })}
      </div>

      {invitations.length === 0 ? (
        <p className="text-[13px] text-[var(--text-muted)]">No invitations found.</p>
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-white">
          <table className="w-full">
            <thead>
              <tr className="bg-[var(--bg-subtle)] text-[var(--text-muted)]">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Student</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Parent email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Invited</th>
              </tr>
            </thead>
            <tbody>
              {invitations.map((inv, i) => (
                <tr
                  key={inv.id}
                  className={`${i < invitations.length - 1 ? "border-b border-[var(--border)]" : ""} transition-colors hover:bg-[var(--bg-subtle)]`}
                >
                  <td className="px-4 py-3">
                    <p className="text-[13px] text-[var(--text)]">{inv.student_email ?? "—"}</p>
                    {(inv.student_first_name || inv.student_last_name) && (
                      <p className="text-[12px] text-[var(--text-muted)]">
                        {[inv.student_first_name, inv.student_last_name].filter(Boolean).join(" ")}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-[var(--text-mid)]">{inv.parent_email}</td>
                  <td className="px-4 py-3">{statusBadge(inv.status)}</td>
                  <td className="px-4 py-3 text-[13px] text-[var(--text-muted)]">
                    {new Date(inv.invited_at).toLocaleDateString("en-US", {
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
