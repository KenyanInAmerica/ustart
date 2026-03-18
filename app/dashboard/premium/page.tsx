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
    <div>
      <h1 className="font-syne text-3xl font-bold tracking-tight text-white mb-1">
        UStart Premium
      </h1>
      <p className="font-dm-sans text-sm text-white/45 mb-8">
        Premium resources and 1-on-1 session materials.
      </p>
      <ContentGrid items={items} />
    </div>
  );
}
