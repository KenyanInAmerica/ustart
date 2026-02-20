import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

// Maps DB tier slugs to human-readable display names for the subheading.
const TIER_NAMES: Record<string, string> = {
  lite: "Lite",
  pro: "Pro",
  premium: "Premium",
};

// Extracts a capitalised first name from an email address.
// Splits on common delimiters (. _ -) and takes the first segment,
// so "randy.smith@email.com" → "Randy", not "Randy.smith".
function getFirstName(email: string): string {
  const local = email.split("@")[0];
  const first = local.split(/[._-]/)[0];
  return first.charAt(0).toUpperCase() + first.slice(1);
}

// Async Server Component — fetches session and membership tier server-side
// so the greeting is fully rendered in the initial HTML with no client flash.
export async function Greeting() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Query the user_access view for the current user's tier.
  // maybeSingle() returns null data (no error) when no membership row exists.
  const { data: access } = await supabase
    .from("user_access")
    .select("membership_tier")
    .maybeSingle();

  // Supabase returns untyped data without a generated schema — cast to the
  // shape we expect. No `any` used; the assertion is a known structure.
  const rawTier =
    (access as { membership_tier: string | null } | null)?.membership_tier ??
    null;
  const planName = rawTier ? (TIER_NAMES[rawTier] ?? rawTier) : null;

  const firstName = user?.email ? getFirstName(user.email) : "";

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
