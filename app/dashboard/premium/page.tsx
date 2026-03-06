import { trackContentVisit } from "@/lib/actions/trackContentVisit";

// Placeholder for the UStart Premium content page (Feature 4).
// trackContentVisit() records the user's first content visit timestamp
// which drives the "Access your content" step in the StartHere card.
export default async function PremiumPage() {
  await trackContentVisit();

  return (
    <div>
      <h1 className="font-syne text-3xl font-bold tracking-tight text-white mb-4">
        UStart Premium
      </h1>
      <p className="font-dm-sans text-sm text-white/45">Content coming soon.</p>
    </div>
  );
}
