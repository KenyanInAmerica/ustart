import { redirect } from "next/navigation";
import { trackContentVisit } from "@/lib/actions/trackContentVisit";
import { fetchDashboardAccess } from "@/lib/dashboard/access";
import { fetchTierContent } from "@/lib/dashboard/content";
import { ContentGrid } from "@/components/dashboard/ContentGrid";

export default async function ConciergePage() {
  const [access, items] = await Promise.all([
    fetchDashboardAccess(),
    fetchTierContent("concierge"),
    trackContentVisit(),
  ]);

  if (access.membershipRank < 3) redirect("/dashboard");

  return (
    <div className="bg-[var(--bg)]">
      <h1 className="mb-1 font-primary text-3xl font-bold tracking-tight text-[var(--text)]">
        UStart Concierge
      </h1>
      <p className="mb-8 font-primary text-sm text-[var(--text-muted)]">
        Everything in Explore plus our most advanced resources for long-term success in the US.
      </p>
      <ContentGrid items={items} />
    </div>
  );
}
