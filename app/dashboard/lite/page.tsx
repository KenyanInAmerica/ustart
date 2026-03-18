import { redirect } from "next/navigation";
import { trackContentVisit } from "@/lib/actions/trackContentVisit";
import { fetchDashboardAccess } from "@/lib/dashboard/access";
import { fetchTierContent } from "@/lib/dashboard/content";
import { ContentGrid } from "@/components/dashboard/ContentGrid";

// UStart Lite content page.
// Server-side entitlement guard — Lite requires membership_rank >= 1.
export default async function LitePage() {
  const [access, items] = await Promise.all([
    fetchDashboardAccess(),
    fetchTierContent("lite"),
    trackContentVisit(),
  ]);

  if (access.membershipRank < 1) redirect("/dashboard");

  return (
    <div>
      <h1 className="font-syne text-3xl font-bold tracking-tight text-white mb-1">
        UStart Lite
      </h1>
      <p className="font-dm-sans text-sm text-white/45 mb-8">
        Your core resource library.
      </p>
      <ContentGrid items={items} />
    </div>
  );
}
