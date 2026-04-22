import { redirect } from "next/navigation";
import { trackContentVisit } from "@/lib/actions/trackContentVisit";
import { fetchDashboardAccess } from "@/lib/dashboard/access";
import { fetchTierContent } from "@/lib/dashboard/content";
import { ContentGrid } from "@/components/dashboard/ContentGrid";

export default async function ExplorePage() {
  const [access, items] = await Promise.all([
    fetchDashboardAccess(),
    fetchTierContent("explore"),
    trackContentVisit(),
  ]);

  if (access.membershipRank < 2) redirect("/dashboard");

  return (
    <div className="bg-[var(--bg)]">
      <h1 className="mb-1 font-primary text-3xl font-bold tracking-tight text-[var(--text)]">
        UStart Explore
      </h1>
      <p className="mb-8 font-primary text-sm text-[var(--text-muted)]">
        Everything in Lite plus deeper guides to help you settle in and thrive.
      </p>
      <ContentGrid items={items} />
    </div>
  );
}
