import { redirect } from "next/navigation";
import { trackContentVisit } from "@/lib/actions/trackContentVisit";
import { fetchDashboardAccess } from "@/lib/dashboard/access";
import { fetchTierContent } from "@/lib/dashboard/content";
import { ContentGrid } from "@/components/dashboard/ContentGrid";

// Explore content page.
// Server-side entitlement guard — requires the has_explore add-on.
export default async function ExplorePage() {
  const [access, items] = await Promise.all([
    fetchDashboardAccess(),
    fetchTierContent("explore"),
    trackContentVisit(),
  ]);

  if (!access.hasExplore) redirect("/dashboard");

  return (
    <div>
      <h1 className="font-syne text-3xl font-bold tracking-tight text-white mb-1">
        Explore
      </h1>
      <p className="font-dm-sans text-sm text-white/45 mb-8">
        Extended resources for deeper exploration.
      </p>
      <ContentGrid items={items} />
    </div>
  );
}
