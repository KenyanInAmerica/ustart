// Async Server Component wrapper for ContentCards.
// Fetches access data and add-on pricing in parallel so ContentCards can
// stream in without waiting for the other dashboard sections.

import { fetchDashboardAccess } from "@/lib/dashboard/access";
import { getPricingById } from "@/lib/config/getPricing";
import { ContentCards } from "@/components/dashboard/ContentCards";
import type { PricingItem, AddonId } from "@/lib/config/pricing";

export async function ContentCardsSection() {
  const [access, parentPack, explore, concierge] = await Promise.all([
    fetchDashboardAccess(),
    getPricingById("parent_pack"),
    getPricingById("explore"),
    getPricingById("concierge"),
  ]);

  const addonPricing: Partial<Record<AddonId, PricingItem>> = {
    ...(parentPack ? { parent_pack: parentPack } : {}),
    ...(explore ? { explore } : {}),
    ...(concierge ? { concierge } : {}),
  };

  return <ContentCards access={access} addonPricing={addonPricing} />;
}
