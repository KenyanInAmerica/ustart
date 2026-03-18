// Admin management page — shows all admins and allows granting/revoking access.
// Revoking is done inline per row; granting is done via the AdminGrantForm.

import { fetchAdmins } from "@/lib/admin/data";
import { AdminGrantForm } from "@/components/admin/AdminGrantForm";
import { AdminRevokeButton } from "./AdminRevokeButton";

export default async function AdminAdminsPage() {
  const admins = await fetchAdmins();

  return (
    <div className="px-8 py-8 max-w-3xl">
      <h1 className="font-syne font-extrabold text-2xl tracking-[-0.02em] text-white mb-1">
        Admins
      </h1>
      <p className="text-[13px] text-white/40 mb-8">
        Manage who has admin access to this portal.
      </p>

      {/* Grant form */}
      <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl px-6 py-5 mb-8">
        <h2 className="text-[13px] font-medium text-white mb-4">Grant admin access</h2>
        <div className="relative">
          <AdminGrantForm />
        </div>
      </div>

      {/* Current admins */}
      <h2 className="text-[13px] font-medium tracking-[0.06em] uppercase text-white/40 mb-4">
        Current admins
      </h2>

      {admins.length === 0 ? (
        <p className="text-[13px] text-white/30">No admins found.</p>
      ) : (
        <div className="border border-white/[0.07] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.07] bg-white/[0.02]">
                <th className="text-left px-4 py-3 text-[12px] text-white/40 font-medium">Email</th>
                <th className="text-left px-4 py-3 text-[12px] text-white/40 font-medium">Name</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {admins.map((admin, i) => (
                <tr
                  key={admin.id}
                  className={i < admins.length - 1 ? "border-b border-white/[0.05]" : ""}
                >
                  <td className="px-4 py-3 text-[13px] text-white/80">{admin.email}</td>
                  <td className="px-4 py-3 text-[13px] text-white/60">
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
