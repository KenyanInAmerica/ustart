import { Greeting } from "@/components/dashboard/Greeting";
import { StartHere } from "@/components/dashboard/StartHere";
import { ContentCards } from "@/components/dashboard/ContentCards";
import { fetchDashboardAccess } from "@/lib/dashboard/access";

// Main dashboard page — fetches the full entitlement snapshot via fetchDashboardAccess,
// which is memoised with React.cache so the layout's call doesn't result in a second
// DB round-trip within the same request.
export default async function DashboardPage() {
  const access = await fetchDashboardAccess();

  return (
    <>
      {/* Feature 2: Greeting & User State */}
      <Greeting />

      {/* Feature 3: Start Here — collapses when all steps are complete */}
      <StartHere
        hasMembership={access.hasMembership}
        hasAccessedContent={access.hasAccessedContent}
        hasAgreedToCommunity={access.hasAgreedToCommunity}
      />

      {/* Feature 4: Content Cards */}
      <p className="font-syne text-[13px] font-bold tracking-[0.06em] uppercase text-white/[0.42] mb-[14px] mt-9">
        Your Content
      </p>
      <ContentCards access={access} />

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
