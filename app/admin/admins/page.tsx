// Admin management page — shows all admins and allows granting/revoking access.
// Revoking is done inline per row; granting is done via the AdminGrantForm.

import { fetchAdmins } from "@/lib/admin/data";
import { AdminGrantForm } from "@/components/admin/AdminGrantForm";
import { AdminRevokeButton } from "./AdminRevokeButton";

export default async function AdminAdminsPage() {
  const admins = await fetchAdmins();

  return (
    <div className="px-8 py-8 max-w-3xl">
      <h1 className="mb-1 font-primary text-2xl font-extrabold tracking-[-0.02em] text-[var(--text)]">
        Admins
      </h1>
      <p className="mb-8 text-[13px] text-[var(--text-muted)]">
        Manage who has admin access to this portal.
      </p>

      {/* Grant form */}
      <div className="mb-8 rounded-[var(--radius-lg)] border border-[var(--border)] bg-white px-6 py-5">
        <h2 className="mb-4 text-[13px] font-medium text-[var(--text)]">Grant admin access</h2>
        <div className="relative">
          <AdminGrantForm />
        </div>
      </div>

      {/* Current admins */}
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
        Current admins
      </h2>

      {admins.length === 0 ? (
        <p className="text-[13px] text-[var(--text-muted)]">No admins found.</p>
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-white">
          <table className="w-full">
            <thead>
              <tr className="bg-[var(--bg-subtle)] text-[var(--text-muted)]">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Name</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {admins.map((admin, i) => (
                <tr
                  key={admin.id}
                  className={`${i < admins.length - 1 ? "border-b border-[var(--border)]" : ""} transition-colors hover:bg-[var(--bg-subtle)]`}
                >
                  <td className="px-4 py-3 text-[13px] text-[var(--text)]">{admin.email}</td>
                  <td className="px-4 py-3 text-[13px] text-[var(--text-mid)]">
                    {[admin.first_name, admin.last_name].filter(Boolean).join(" ") || "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <AdminRevokeButton targetUserId={admin.id} />
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
