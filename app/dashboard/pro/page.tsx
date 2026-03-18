import { redirect } from "next/navigation";
import { trackContentVisit } from "@/lib/actions/trackContentVisit";
import { fetchDashboardAccess } from "@/lib/dashboard/access";
import { fetchTierContent } from "@/lib/dashboard/content";
import { ContentGrid } from "@/components/dashboard/ContentGrid";

// UStart Pro content page.
// Server-side entitlement guard — Pro requires membership_rank >= 2.
export default async function ProPage() {
  const [access, items] = await Promise.all([
    fetchDashboardAccess(),
    fetchTierContent("pro"),
    trackContentVisit(),
  ]);

  if (access.membershipRank < 2) redirect("/dashboard");

  return (
    <div>
      <h1 className="font-syne text-3xl font-bold tracking-tight text-white mb-1">
        UStart Pro
      </h1>
      <p className="font-dm-sans text-sm text-white/45 mb-8">
        Your full resource library.
      </p>
      <ContentGrid items={items} />
    </div>
  );
}
