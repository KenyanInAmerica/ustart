import { redirect } from "next/navigation";
import { trackContentVisit } from "@/lib/actions/trackContentVisit";
import { fetchDashboardAccess } from "@/lib/dashboard/access";
import { getNotionChildPages } from "@/lib/notion/fetcher";
import { NOTION_PAGE_IDS } from "@/lib/notion/config";

export default async function ExplorePage() {
  const [access, modules] = await Promise.all([
    fetchDashboardAccess(),
    getNotionChildPages(NOTION_PAGE_IDS.explore),
    trackContentVisit(),
  ]);

  if (access.role === "parent") redirect("/dashboard/parent/content");
  if (access.membershipRank < 2) redirect("/dashboard");

  if (modules.length === 0) {
    return (
      <div>
        <h1 className="mb-1 font-primary text-3xl font-bold tracking-tight text-[var(--text)]">
          UStart Explore
        </h1>
        <p className="mt-8 text-sm text-[var(--text-muted)]">
          Content coming soon. Check back shortly.
        </p>
      </div>
    );
  }

  redirect(`/dashboard/content/explore/${modules[0].slug}`);
}
