import { redirect } from "next/navigation";
import { trackContentVisit } from "@/lib/actions/trackContentVisit";
import { fetchDashboardAccess } from "@/lib/dashboard/access";
import { getNotionChildPages } from "@/lib/notion/fetcher";
import { NOTION_PAGE_IDS } from "@/lib/notion/config";

export default async function LitePage() {
  const [access, modules] = await Promise.all([
    fetchDashboardAccess(),
    getNotionChildPages(NOTION_PAGE_IDS.lite),
    trackContentVisit(),
  ]);

  if (access.role === "parent") redirect("/dashboard/parent/content");
  if (access.membershipRank < 1) redirect("/dashboard");

  if (modules.length === 0) {
    return (
      <div>
        <h1 className="mb-1 font-primary text-3xl font-bold tracking-tight text-[var(--text)]">
          UStart Lite
        </h1>
        <p className="mt-8 text-sm text-[var(--text-muted)]">
          Content coming soon. Check back shortly.
        </p>
      </div>
    );
  }

  redirect(`/dashboard/content/lite/${modules[0].slug}`);
}
