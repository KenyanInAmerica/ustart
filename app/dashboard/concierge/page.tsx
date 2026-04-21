import { redirect } from "next/navigation";
import { trackContentVisit } from "@/lib/actions/trackContentVisit";
import { fetchDashboardAccess } from "@/lib/dashboard/access";
import { fetchTierContent } from "@/lib/dashboard/content";
import { ContentGrid } from "@/components/dashboard/ContentGrid";

// Concierge content page.
// Server-side entitlement guard — requires the has_concierge add-on.
export default async function ConciergePage() {
  const [access, items] = await Promise.all([
    fetchDashboardAccess(),
    fetchTierContent("concierge"),
    trackContentVisit(),
  ]);

  if (!access.hasConcierge) redirect("/dashboard");

  return (
    <div className="bg-[var(--bg)]">
      <h1 className="mb-1 font-primary text-3xl font-bold tracking-tight text-[var(--text)]">
        Concierge
      </h1>
      <p className="mb-8 font-primary text-sm text-[var(--text-muted)]">
        Priority support resources and session materials.
      </p>
      <ContentGrid items={items} />
    </div>
  );
}
