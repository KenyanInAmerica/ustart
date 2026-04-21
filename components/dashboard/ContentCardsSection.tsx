// Async Server Component wrapper for ContentCards.
// Fetches access data and add-on pricing in parallel so ContentCards can
// stream in without waiting for the other dashboard sections.

import { fetchDashboardAccess } from "@/lib/dashboard/access";
import { getPricingById } from "@/lib/config/getPricing";
import { ContentCards } from "@/components/dashboard/ContentCards";
import type { PricingItem, ProductId } from "@/lib/config/pricing";

export async function ContentCardsSection() {
  const [access, parentPack] = await Promise.all([
    fetchDashboardAccess(),
    getPricingById("parent_pack"),
  ]);

  const upsellPricing: Partial<Record<ProductId, PricingItem>> = {
    ...(parentPack ? { parent_pack: parentPack } : {}),
  };

  return <ContentCards access={access} upsellPricing={upsellPricing} />;
}
