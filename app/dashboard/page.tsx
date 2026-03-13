import { Greeting } from "@/components/dashboard/Greeting";
import { StartHere } from "@/components/dashboard/StartHere";
import { ContentCards } from "@/components/dashboard/ContentCards";
import { CommunitySection } from "@/components/dashboard/CommunitySection";
import { AccountStrip } from "@/components/dashboard/AccountStrip";
import { fetchDashboardAccess, fetchWhatsappLink } from "@/lib/dashboard/access";

// Main dashboard page — all fetches are memoised with React.cache so the
// layout's calls don't result in additional DB round-trips within the same request.
export default async function DashboardPage() {
  const [access, whatsappLink] = await Promise.all([
    fetchDashboardAccess(),
    fetchWhatsappLink(),
  ]);

  return (
    <>
      {/* Feature 2: Greeting & User State */}
      <Greeting />

      {/* Feature 3: Start Here — collapses when all steps are complete */}
      <StartHere
        hasMembership={access.hasMembership}
        hasAccessedContent={access.hasAccessedContent}
        hasAgreedToCommunity={access.hasAgreedToCommunity}
        role={access.role}
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
      <CommunitySection
        hasAgreedToCommunity={access.hasAgreedToCommunity}
        phoneNumber={access.phoneNumber}
        whatsappLink={whatsappLink}
      />

      {/* Feature 6: Account Strip */}
      <p className="font-syne text-[13px] font-bold tracking-[0.06em] uppercase text-white/[0.42] mb-[14px] mt-9">
        Account
      </p>
      <AccountStrip access={access} />
    </>
  );
}
