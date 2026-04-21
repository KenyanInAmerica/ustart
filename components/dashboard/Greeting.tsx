import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { accentSurfaceClass, type ProductAccent } from "@/lib/config/productAccents";

const TIER_NAMES: Record<string, string> = {
  lite: "Lite",
  explore: "Explore",
  concierge: "Concierge",
};

const TIER_ACCENTS: Record<string, ProductAccent> = {
  lite: "lite",
  explore: "explore",
  concierge: "concierge",
};

export async function Greeting() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: access } = await supabase
    .from("user_access")
    .select("membership_tier, first_name")
    .eq("id", user!.id)
    .maybeSingle();

  const raw = access as { membership_tier: string | null; first_name: string | null } | null;
  const rawTier = raw?.membership_tier ?? null;
  const planName = rawTier ? (TIER_NAMES[rawTier] ?? rawTier) : null;
  const planAccent = rawTier ? (TIER_ACCENTS[rawTier] ?? "default") : null;
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
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-primary text-3xl font-bold tracking-tight text-[var(--text)]">
          {timeOfDay}{firstName ? `, ${firstName}` : ""}{timeOfDay === "Working late" ? "?" : "."}
        </h1>
        {planName && planAccent && (
          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${accentSurfaceClass(planAccent)}`}>
            {planName} plan
          </span>
        )}
      </div>

      <p className="mt-1 font-primary text-sm text-[var(--text-muted)]">
        {planName
          ? `Here's your UStart portal. You're on the ${planName} plan.`
          : "Here's your UStart portal. Choose a plan to get started."}
      </p>

      {!planName && (
        <Link
          href="/pricing"
          className="mt-3 inline-flex items-center justify-center rounded-[var(--radius-sm)] bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[var(--accent-hover)]"
        >
          View Plans
        </Link>
      )}
    </div>
  );
}
