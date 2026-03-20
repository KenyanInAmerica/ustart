// Admin overview page — summary stats and recent signups.
// Server Component: data is fetched at request time, no client state needed.

import { fetchAdminOverview } from "@/lib/admin/data";

export default async function AdminOverviewPage() {
  const { stats, recentSignups } = await fetchAdminOverview();

  const statCards = [
    { label: "Total Users", value: stats.totalUsers },
    { label: "Total Students", value: stats.totalStudents },
    { label: "Total Parents", value: stats.totalParents },
    { label: "Pending invitations", value: stats.pendingInvitations },
    { label: "Community members", value: stats.communityMembers },
    { label: "Explore add-on", value: stats.activeExplore },
    { label: "Concierge add-on", value: stats.activeConcierge },
    { label: "Parent Pack", value: stats.activeParentPack },
  ];

  const tierOrder = ["lite", "pro", "premium"];

  return (
    <div className="px-8 py-8 max-w-5xl">
      <h1 className="font-syne font-extrabold text-2xl tracking-[-0.02em] text-white mb-1">
        Overview
      </h1>
      <p className="text-[13px] text-white/40 mb-8">
        Platform snapshot — live data from the database.
      </p>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white/[0.03] border border-white/[0.07] rounded-xl px-5 py-4"
          >
            <p className="text-[12px] text-white/40 mb-1">{card.label}</p>
            <p className="text-3xl font-syne font-extrabold text-white">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Members by tier */}
      <div className="mb-10">
        <h2 className="text-[13px] font-medium tracking-[0.06em] uppercase text-white/40 mb-4">
          Members by tier
        </h2>
        <div className="flex gap-4">
          {tierOrder.map((tier) => (
            <div
              key={tier}
              className="bg-white/[0.03] border border-white/[0.07] rounded-xl px-5 py-4 w-36"
            >
              <p className="text-[12px] text-white/40 mb-1 capitalize">{tier}</p>
              <p className="text-2xl font-syne font-extrabold text-white">
                {stats.membersByTier[tier] ?? 0}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent signups */}
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
    </div>
  );
}
