import { createClient } from "@/lib/supabase/server";
import { Greeting } from "@/components/dashboard/Greeting";
import { StartHere } from "@/components/dashboard/StartHere";

// Main dashboard page — async so it can fetch entitlement data and pass
// computed booleans to Feature components as props.
// Feature 2 (Greeting) and Feature 3 (StartHere) are live.
// Features 4–6 remain as placeholders to be dropped in sequentially.
export default async function DashboardPage() {
  const supabase = createClient();

  // Single query to user_access — the view now includes first_content_visit_at
  // (sourced from profiles.first_content_visit_at, written by trackContentVisit).
  // maybeSingle() returns null data (no error) when no row exists.
  const { data: access } = await supabase
    .from("user_access")
    .select("membership_tier, has_agreed_to_community, first_content_visit_at")
    .maybeSingle();

  const rawAccess = access as {
    membership_tier: string | null;
    has_agreed_to_community: boolean | null;
    first_content_visit_at: string | null;
  } | null;

  const hasMembership = (rawAccess?.membership_tier ?? null) !== null;
  const hasAgreedToCommunity = rawAccess?.has_agreed_to_community === true;
  // True once trackContentVisit() has recorded a visit — null means never visited.
  const hasAccessedContent = rawAccess?.first_content_visit_at != null;

  return (
    <>
      {/* Feature 2: Greeting & User State */}
      <Greeting />

      {/* Feature 3: Start Here */}
      <StartHere
        hasMembership={hasMembership}
        hasAccessedContent={hasAccessedContent}
        hasAgreedToCommunity={hasAgreedToCommunity}
      />

      {/* Feature 4: Content Cards */}
      <p className="font-syne text-[13px] font-bold tracking-[0.06em] uppercase text-white/[0.42] mb-[14px] mt-9">
        Your Content
      </p>
      <div className="bg-[#0C1220] border border-dashed border-white/[0.12] rounded-[14px] p-12 text-center mb-4">
        <p className="font-syne text-[13px] font-bold tracking-[0.06em] uppercase text-white/20 mb-2">
          Feature 4
        </p>
        <p className="text-[13px] text-white/20">
          Content cards — Lite, Parent Pack, Explore, Concierge with access gating
        </p>
      </div>

      {/* Feature 5: Community */}
      <p className="font-syne text-[13px] font-bold tracking-[0.06em] uppercase text-white/[0.42] mb-[14px] mt-9">
        Community
      </p>
      <div className="bg-[#0C1220] border border-dashed border-white/[0.12] rounded-[14px] p-12 text-center mb-4">
        <p className="font-syne text-[13px] font-bold tracking-[0.06em] uppercase text-white/20 mb-2">
          Feature 5
        </p>
        <p className="text-[13px] text-white/20">
          Community gate — rules, checkbox, WhatsApp link reveal
        </p>
      </div>

      {/* Feature 6: Account Strip */}
      <p className="font-syne text-[13px] font-bold tracking-[0.06em] uppercase text-white/[0.42] mb-[14px] mt-9">
        Account
      </p>
      <div className="bg-[#0C1220] border border-dashed border-white/[0.12] rounded-[14px] p-12 text-center mb-4">
        <p className="font-syne text-[13px] font-bold tracking-[0.06em] uppercase text-white/20 mb-2">
          Feature 6
        </p>
        <p className="text-[13px] text-white/20">
          Account &amp; billing strip — links to Stripe customer portal
        </p>
      </div>
    </>
  );
}
