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
    <div className="bg-[var(--bg)]">
      <h1 className="mb-1 font-primary text-3xl font-bold tracking-tight text-[var(--text)]">
        UStart Pro
      </h1>
      <p className="mb-8 font-primary text-sm text-[var(--text-muted)]">
        Your full resource library.
      </p>
      <ContentGrid items={items} />
    </div>
  );
}
