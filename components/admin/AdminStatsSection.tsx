import { fetchAdminOverview } from "@/lib/admin/data";
import { Card } from "@/components/ui/Card";

export async function AdminStatsSection() {
  const { stats } = await fetchAdminOverview();

  const statCards = [
    { label: "Total Users", value: stats.totalUsers, accent: "border-l-[#3083DC]" },
    { label: "Total Students", value: stats.totalStudents, accent: "border-l-[#4ECBA5]" },
    { label: "Total Parents", value: stats.totalParents, accent: "border-l-[#F5C842]" },
    { label: "Inactive accounts", value: stats.inactiveAccounts, accent: "border-l-[#E54B4B]" },
    { label: "Pending invitations", value: stats.pendingInvitations, accent: "border-l-[#F5C842]" },
    { label: "Community members", value: stats.communityMembers, accent: "border-l-[#4ECBA5]" },
    { label: "Explore members", value: stats.activeExplore, accent: "border-l-[#4ECBA5]" },
    { label: "Concierge members", value: stats.activeConcierge, accent: "border-l-[#9B8EC4]" },
    { label: "Parent Pack", value: stats.activeParentPack, accent: "border-l-[#F5C842]" },
  ];

  const tierOrder = ["lite", "explore", "concierge"];

  return (
    <>
      <div className="mb-10 grid grid-cols-3 gap-4">
        {statCards.map((card) => (
          <Card key={card.label} className={`border border-[var(--border)] border-l-4 ${card.accent}`} padding="md">
            <p className="mb-1 text-sm text-[var(--text-muted)]">{card.label}</p>
            <p className="font-primary text-2xl font-bold text-[var(--text)]">{card.value}</p>
          </Card>
        ))}
      </div>

      <div className="mb-10">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
          Members by tier
        </h2>
        <div className="flex gap-4">
          {tierOrder.map((tier) => (
            <Card key={tier} className="w-36 border border-[var(--border)]" padding="md">
              <p className="mb-1 text-sm capitalize text-[var(--text-muted)]">{tier}</p>
              <p className="font-primary text-2xl font-bold text-[var(--text)]">
                {stats.membersByTier[tier] ?? 0}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
