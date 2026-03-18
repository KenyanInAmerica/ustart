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
    <div>
      <h1 className="font-syne text-3xl font-bold tracking-tight text-white mb-1">
        Concierge
      </h1>
      <p className="font-dm-sans text-sm text-white/45 mb-8">
        Priority support resources and session materials.
      </p>
      <ContentGrid items={items} />
    </div>
  );
}
