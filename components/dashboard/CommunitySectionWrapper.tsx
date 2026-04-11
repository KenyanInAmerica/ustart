// Async Server Component wrapper for CommunitySection.
// Fetches access and the WhatsApp link in parallel so this section streams in
// independently of ContentCards and AccountStrip.

import { fetchDashboardAccess, fetchWhatsappLink } from "@/lib/dashboard/access";
import { CommunitySection } from "@/components/dashboard/CommunitySection";

export async function CommunitySectionWrapper() {
  const [access, whatsappLink] = await Promise.all([
    fetchDashboardAccess(),
    fetchWhatsappLink(),
  ]);

  return (
    <CommunitySection
      hasAgreedToCommunity={access.hasAgreedToCommunity}
      phoneNumber={access.phoneNumber}
      whatsappLink={whatsappLink}
    />
  );
}
