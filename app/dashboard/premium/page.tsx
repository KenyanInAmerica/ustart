import { redirect } from "next/navigation";
import { trackContentVisit } from "@/lib/actions/trackContentVisit";
import { fetchDashboardAccess } from "@/lib/dashboard/access";
import { fetchTierContent } from "@/lib/dashboard/content";
import { ContentGrid } from "@/components/dashboard/ContentGrid";

// UStart Premium content page.
// Server-side entitlement guard — Premium requires membership_rank >= 3.
export default async function PremiumPage() {
  const [access, items] = await Promise.all([
    fetchDashboardAccess(),
    fetchTierContent("premium"),
    trackContentVisit(),
  ]);

  if (access.membershipRank < 3) redirect("/dashboard");

  return (
    <div className="bg-[var(--bg)]">
      <h1 className="mb-1 font-primary text-3xl font-bold tracking-tight text-[var(--text)]">
        UStart Premium
      </h1>
      <p className="mb-8 font-primary text-sm text-[var(--text-muted)]">
        Premium resources and 1-on-1 session materials.
      </p>
      <ContentGrid items={items} />
    </div>
  );
}
