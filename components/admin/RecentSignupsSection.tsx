// Async Server Component for the recent signups table.
// fetchAdminOverview is memoised with React.cache so both this component and
// AdminStatsSection share a single DB round-trip per request.

import { fetchAdminOverview } from "@/lib/admin/data";

export async function RecentSignupsSection() {
  const { recentSignups } = await fetchAdminOverview();

  return (
    <div>
      <h2 className="text-[13px] font-medium tracking-[0.06em] uppercase text-white/40 mb-4">
        Recent signups
      </h2>
      {recentSignups.length === 0 ? (
        <p className="text-[13px] text-white/30">No recent signups.</p>
      ) : (
        <div className="border border-white/[0.07] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.07] bg-white/[0.02]">
                <th className="text-left px-4 py-3 text-[12px] text-white/40 font-medium">Name</th>
                <th className="text-left px-4 py-3 text-[12px] text-white/40 font-medium">Email</th>
                <th className="text-left px-4 py-3 text-[12px] text-white/40 font-medium">Role</th>
                <th className="text-left px-4 py-3 text-[12px] text-white/40 font-medium">University</th>
                <th className="text-left px-4 py-3 text-[12px] text-white/40 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {recentSignups.map((u, i) => (
                <tr
                  key={u.id}
                  className={i < recentSignups.length - 1 ? "border-b border-white/[0.05]" : ""}
                >
                  <td className="px-4 py-3 text-[13px] text-white/80">
                    {[u.first_name, u.last_name].filter(Boolean).join(" ") || "—"}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-white/60">{u.email}</td>
                  <td className="px-4 py-3 text-[13px] text-white/60 capitalize">{u.role}</td>
                  <td className="px-4 py-3 text-[13px] text-white/40">{u.university_name ?? "—"}</td>
                  <td className="px-4 py-3 text-[13px] text-white/40">
                    {new Date(u.created_at).toLocaleDateString("en-US", {
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
