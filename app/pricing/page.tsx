// Public pricing page — accessible to all visitors, no auth required.
// Pricing data is fetched live from the pricing table so admin edits
// are reflected immediately without a redeploy.
//
// For authenticated users, CTA state is computed server-side:
//   - "has-access"  → user owns this exact tier
//   - "included"    → user owns a higher tier (this one is included)
//   - "buy"         → user can purchase this tier

import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { BuyNowButton } from "@/components/pricing/BuyNowButton";
import { getPublicPricing, getPricingById } from "@/lib/config/getPricing";
import { fetchDashboardAccess } from "@/lib/dashboard/access";
import { createClient } from "@/lib/supabase/server";
import type { PricingItem } from "@/lib/config/pricing";

// Small check icon for feature lists.
function CheckIcon() {
  return (
    <svg
      className="shrink-0 mt-0.5 opacity-50"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="2"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function formatPrice(price: number): string {
  return `$${price}`;
}

function billingLabel(billing: PricingItem["billing"]): string {
  if (billing === "one-time") return "one-time · lifetime access";
  if (billing === "monthly") return "per month";
  return "per year";
}

// Map tier product IDs to membership ranks so we can compare with the user's rank.
const TIER_RANK: Record<string, number> = { lite: 1, pro: 2, premium: 3 };

type CtaState = "buy" | "has-access" | "included";

function getCtaState(planId: string, userRank: number): CtaState {
  const planRank = TIER_RANK[planId] ?? 0;
  if (planRank === 0) return "buy"; // not a membership tier
  if (userRank === planRank) return "has-access";
  if (userRank > planRank) return "included";
  return "buy";
}

export default async function PricingPage() {
  const supabase = createClient();

  // Check auth state. We fetch public pricing and the auth session in parallel.
  // Parent Pack pricing is fetched for the upsell modal (Fix 5) — not displayed as a card.
  const [{ data: { user } }, tiers] = await Promise.all([
    supabase.auth.getUser(),
    getPublicPricing(),
  ]);

  const isAuthenticated = user !== null;

  // For authenticated users, fetch their access state and Parent Pack pricing in parallel.
  // Both are null for unauthenticated visitors — no extra DB work.
  const [access, parentPackPricing] = await Promise.all([
    isAuthenticated ? fetchDashboardAccess() : Promise.resolve(null),
    isAuthenticated ? getPricingById("parent_pack") : Promise.resolve(null),
  ]);

  const userRank = access?.membershipRank ?? 0;
  // Show the Parent Pack upsell only to authenticated users who don't already have it.
  const parentPackUpsell =
    isAuthenticated && !access?.hasParentSeat && parentPackPricing
      ? { price: parentPackPricing.price }
      : null;

  // Pro card is the middle (index 1) when ordered by display_order.
  const featuredId = tiers[1]?.id ?? "pro";

  return (
    <>
      <Navbar />

      <main className="pt-28 pb-20 px-6 md-900:px-12 max-w-[1160px] mx-auto">
        {/* Page header */}
        <div className="text-center mb-16">
          <h1 className="font-syne font-bold text-[clamp(28px,4vw,48px)] tracking-[-0.03em] text-white mb-4">
            Simple, transparent pricing
          </h1>
          <p className="font-dm-sans text-[15px] text-white/50 max-w-md mx-auto">
            Everything you need to navigate life in the United States as an
            international student — pay once, keep access forever.
          </p>
        </div>

        {/* Tier cards — only publicly listed products are shown here.
            is_public controls visibility; no special-casing per product ID. */}
        {tiers.length > 0 ? (
          <div className="grid grid-cols-1 md-900:grid-cols-3 gap-4 items-start">
            {tiers.map((plan) => {
              const isFeatured = plan.id === featuredId;
              const ctaState = isAuthenticated
                ? getCtaState(plan.id, userRank)
                : "buy";
              // Upsell only fires for membership tier purchases — not add-ons.
              const isTier = (["lite", "pro", "premium"] as string[]).includes(plan.id);

              return (
                <div
                  key={plan.id}
                  className={[
                    "relative rounded-2xl px-7 py-9 flex flex-col gap-6",
                    isFeatured
                      ? "bg-[#0E1624] border border-white/[0.25]"
                      : "bg-[#0C1220] border border-white/[0.07]",
                  ].join(" ")}
                >
                  {/* Most Popular badge — only on featured card */}
                  {isFeatured && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold tracking-[0.10em] uppercase bg-white text-[#05080F] px-3 py-[3px] rounded-full">
                      Most Popular
                    </span>
                  )}

                  {/* Plan name + price */}
                  <div>
                    <p className="font-syne font-bold text-sm text-white/50 mb-2 uppercase tracking-[0.06em]">
                      {plan.name}
                    </p>
                    <p className="font-syne font-extrabold text-4xl tracking-[-0.04em] text-white mb-1">
                      {formatPrice(plan.price)}
                    </p>
                    <p className="font-dm-sans text-xs text-white/40">
                      {billingLabel(plan.billing)}
                    </p>
                  </div>

                  {/* Description */}
                  {plan.description && (
                    <p className="font-dm-sans text-sm text-white/50 leading-relaxed">
                      {plan.description}
                    </p>
                  )}

                  {/* Feature list */}
                  {plan.features && plan.features.length > 0 && (
                    <ul className="flex flex-col gap-2">
                      {plan.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-2">
                          <CheckIcon />
                          <span className="font-dm-sans text-sm text-white/60">
                            {feat}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <BuyNowButton
                    featured={isFeatured}
                    ctaState={ctaState}
                    // Parent Pack upsell only fires for "buy" CTAs on tier cards.
                    // Has-access and included states skip the upsell entirely.
                    parentPackUpsell={ctaState === "buy" && isTier ? parentPackUpsell : null}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-white/40 text-sm">
            Pricing information unavailable. Please check back soon.
          </p>
        )}
      </main>

      <Footer />
    </>
  );
}
