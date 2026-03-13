import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

// Maps DB tier slugs to human-readable display names for the subheading.
const TIER_NAMES: Record<string, string> = {
  lite: "Lite",
  pro: "Pro",
  premium: "Premium",
};

// Async Server Component — fetches session and membership tier server-side
// so the greeting is fully rendered in the initial HTML with no client flash.
export async function Greeting() {
  const supabase = createClient();

  // Get the authenticated user's ID to scope the user_access query.
  // .eq("id", user.id) is required — without it the query returns null.
  const { data: { user } } = await supabase.auth.getUser();

  const { data: access } = await supabase
    .from("user_access")
    .select("membership_tier, first_name")
    .eq("id", user!.id)
    .maybeSingle();

  // Supabase returns untyped data without a generated schema — cast to the
  // shape we expect. No `any` used; the assertion is a known structure.
  const raw = access as { membership_tier: string | null; first_name: string | null } | null;

  const rawTier = raw?.membership_tier ?? null;
  const planName = rawTier ? (TIER_NAMES[rawTier] ?? rawTier) : null;

  // Only use the stored first_name — no email-derived fallback.
  const firstName = raw?.first_name ?? null;

  const hour = new Date().getHours();
  const timeOfDay =
    hour >= 0 && hour < 5
      ? "Working late"
      : hour >= 5 && hour < 12
      ? "Good morning"
      : hour >= 12 && hour < 17
      ? "Good afternoon"
      : "Good evening";

  return (
    <div className="mb-10">
      <h1 className="font-syne text-3xl font-bold tracking-tight text-white">
        {timeOfDay}{firstName ? `, ${firstName}` : ""}{timeOfDay === "Working late" ? "?" : "."}
      </h1>
      <p className="font-dm-sans text-sm text-white/45 mt-1">
        {planName
          ? `Here's your UStart portal. You're on the ${planName} plan.`
          : "Here's your UStart portal. Choose a plan to get started."}
      </p>
      {/* Prompt unpaid users to pick a plan — hidden once they have an active membership */}
      {!planName && (
        <Link
          href="/pricing"
          className="inline-block mt-3 bg-white text-[#05080F] text-sm font-medium px-4 py-2 rounded-lg"
        >
          View Plans →
        </Link>
      )}
    </div>
  );
}