// Async Server Component for the admin stats grid and members-by-tier cards.
// Streams in independently of RecentSignupsSection so neither blocks the other.

import { fetchAdminOverview } from "@/lib/admin/data";

export async function AdminStatsSection() {
  const { stats } = await fetchAdminOverview();

  const statCards = [
    { label: "Total Users", value: stats.totalUsers },
    { label: "Total Students", value: stats.totalStudents },
    { label: "Total Parents", value: stats.totalParents },
    { label: "Inactive accounts", value: stats.inactiveAccounts },
    { label: "Pending invitations", value: stats.pendingInvitations },
    { label: "Community members", value: stats.communityMembers },
    { label: "Explore add-on", value: stats.activeExplore },
    { label: "Concierge add-on", value: stats.activeConcierge },
    { label: "Parent Pack", value: stats.activeParentPack },
  ];

  const tierOrder = ["lite", "pro", "premium"];

  return (
    <>
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
    </>
  );
}
