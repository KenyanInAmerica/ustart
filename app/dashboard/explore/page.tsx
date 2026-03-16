import { redirect } from "next/navigation";
import { trackContentVisit } from "@/lib/actions/trackContentVisit";
import { fetchDashboardAccess } from "@/lib/dashboard/access";

// Placeholder for the Explore content page (Feature 4).
// trackContentVisit() records the user's first content visit timestamp.
export default async function ExplorePage() {
  const [access] = await Promise.all([
    fetchDashboardAccess(),
    trackContentVisit(),
  ]);

  // Server-side entitlement guard — Explore requires the has_explore add-on.
  if (!access.hasExplore) redirect("/dashboard");

  return (
    <div>
      <h1 className="font-syne text-3xl font-bold tracking-tight text-white mb-4">
        Explore
      </h1>
      <p className="font-dm-sans text-sm text-white/45">Content coming soon.</p>
    </div>
  );
}
