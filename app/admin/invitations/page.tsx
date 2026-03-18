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
      pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
      accepted: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      cancelled: "bg-white/[0.05] text-white/40 border-white/[0.10]",
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] border capitalize ${styles[status] ?? ""}`}>
        {status}
      </span>
    );
  }

  return (
    <div className="px-8 py-8 max-w-5xl">
      <h1 className="font-syne font-extrabold text-2xl tracking-[-0.02em] text-white mb-1">
        Parent Invitations
      </h1>
      <p className="text-[13px] text-white/40 mb-8">
        View and manage parent–student links, or manually link a parent below.
      </p>

      {/* Manual link form */}
      <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl px-6 py-5 mb-8">
        <h2 className="text-[13px] font-medium text-white mb-4">Manually link a parent</h2>
        <InvitationLinkForm />
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 mb-5">
        {STATUS_OPTIONS.map((opt) => {
          const href = opt.value ? `/admin/invitations?status=${opt.value}` : "/admin/invitations";
          const active = (statusFilter ?? "") === opt.value;
          return (
            <Link
              key={opt.value}
              href={href}
              className={`px-3 py-1.5 text-[13px] rounded-lg transition-colors ${
                active
                  ? "bg-white/[0.08] text-white"
                  : "text-white/40 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              {opt.label}
            </Link>
          );
        })}
      </div>

      {invitations.length === 0 ? (
        <p className="text-[13px] text-white/30">No invitations found.</p>
      ) : (
        <div className="border border-white/[0.07] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.07] bg-white/[0.02]">
                <th className="text-left px-4 py-3 text-[12px] text-white/40 font-medium">Student</th>
                <th className="text-left px-4 py-3 text-[12px] text-white/40 font-medium">Parent email</th>
                <th className="text-left px-4 py-3 text-[12px] text-white/40 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-[12px] text-white/40 font-medium">Invited</th>
              </tr>
            </thead>
            <tbody>
              {invitations.map((inv, i) => (
                <tr
                  key={inv.id}
                  className={i < invitations.length - 1 ? "border-b border-white/[0.05]" : ""}
                >
                  <td className="px-4 py-3">
                    <p className="text-[13px] text-white/80">{inv.student_email ?? "—"}</p>
                    {(inv.student_first_name || inv.student_last_name) && (
                      <p className="text-[12px] text-white/40">
                        {[inv.student_first_name, inv.student_last_name].filter(Boolean).join(" ")}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-white/60">{inv.parent_email}</td>
                  <td className="px-4 py-3">{statusBadge(inv.status)}</td>
                  <td className="px-4 py-3 text-[13px] text-white/40">
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
