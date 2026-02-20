import { trackContentVisit } from "@/lib/actions/trackContentVisit";

// Placeholder for the Explore content page (Feature 4).
// trackContentVisit() records the user's first content visit timestamp.
export default async function ExplorePage() {
  await trackContentVisit();

  return (
    <div>
      <h1 className="font-syne text-3xl font-bold tracking-tight text-white mb-4">
        Explore
      </h1>
      <p className="font-dm-sans text-sm text-white/45">Content coming soon.</p>
    </div>
  );
}
