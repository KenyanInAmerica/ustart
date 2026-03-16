import { redirect } from "next/navigation";
import { trackContentVisit } from "@/lib/actions/trackContentVisit";
import { fetchDashboardAccess } from "@/lib/dashboard/access";

// Placeholder for the UStart Premium content page (Feature 4).
// trackContentVisit() records the user's first content visit timestamp
// which drives the "Access your content" step in the StartHere card.
export default async function PremiumPage() {
  const [access] = await Promise.all([
    fetchDashboardAccess(),
    trackContentVisit(),
  ]);

  // Server-side entitlement guard — Premium requires membership_rank >= 3.
  if (access.membershipRank < 3) redirect("/dashboard");

  return (
    <div>
      <h1 className="font-syne text-3xl font-bold tracking-tight text-white mb-4">
        UStart Premium
      </h1>
      <p className="font-dm-sans text-sm text-white/45">Content coming soon.</p>
    </div>
  );
}
