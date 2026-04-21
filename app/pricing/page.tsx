import { Footer } from "@/components/ui/Footer";
import { Navbar } from "@/components/ui/Navbar";
import { Card } from "@/components/ui/Card";
import { BuyNowButton } from "@/components/pricing/BuyNowButton";
import { brand } from "@/lib/config/brand";
import { getPricingById, getPublicPricing } from "@/lib/config/getPricing";
import { fetchDashboardAccess } from "@/lib/dashboard/access";
import { createClient } from "@/lib/supabase/server";
import type { PricingItem } from "@/lib/config/pricing";

function CheckIcon() {
  return (
    <svg
      className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
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

const TIER_RANK: Record<string, number> = { lite: 1, explore: 2, concierge: 3 };

type CtaState = "buy" | "has-access" | "included";

function getCtaState(planId: string, userRank: number): CtaState {
  const planRank = TIER_RANK[planId] ?? 0;
  if (planRank === 0) return "buy";
  if (userRank === planRank) return "has-access";
  if (userRank > planRank) return "included";
  return "buy";
}

export default async function PricingPage() {
  const supabase = createClient();
  const [{ data: { user } }, tiers] = await Promise.all([
    supabase.auth.getUser(),
    getPublicPricing(),
  ]);

  const isAuthenticated = user !== null;
  const [access, parentPackPricing] = await Promise.all([
    isAuthenticated ? fetchDashboardAccess() : Promise.resolve(null),
    isAuthenticated ? getPricingById("parent_pack") : Promise.resolve(null),
  ]);

  const userRank = access?.membershipRank ?? 0;
  const parentPackUpsell =
    isAuthenticated && !access?.hasParentSeat && parentPackPricing
      ? { price: parentPackPricing.price }
      : null;

  const featuredId = tiers[1]?.id ?? "explore";

  return (
    <>
      <Navbar />

      <main className="mx-auto max-w-[1160px] bg-[var(--bg)] px-6 pb-20 pt-28 md-900:px-12">
        <div className="mb-16 text-center">
          <h1 className="mb-4 font-primary text-[clamp(28px,4vw,48px)] font-bold tracking-[-0.03em] text-[var(--text)]">
            Simple, transparent pricing
          </h1>
          <p className="mx-auto mb-2 max-w-md font-primary text-[15px] text-[var(--text-muted)]">
            {brand.tagline}
          </p>
          <p className="mx-auto max-w-md font-primary text-[15px] text-[var(--text-muted)]">
            Everything you need to navigate life in the United States as an international student — pay once, keep access forever.
          </p>
        </div>

        {tiers.length > 0 ? (
          <div className="grid grid-cols-1 items-start gap-4 md-900:grid-cols-3">
            {tiers.map((plan) => {
              const isFeatured = plan.id === featuredId;
              const ctaState = isAuthenticated ? getCtaState(plan.id, userRank) : "buy";
              const isTier = (["lite", "explore", "concierge"] as string[]).includes(plan.id);

              return (
                <Card
                  key={plan.id}
                  className={[
                    "relative flex h-full flex-col gap-6 border bg-white",
                    isFeatured
                      ? "border-2 border-[var(--accent)]"
                      : "border border-[var(--border)]",
                  ].join(" ")}
                  padding="lg"
                >
                  {isFeatured && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--accent)] px-3 py-[3px] text-[10px] font-bold uppercase tracking-[0.10em] text-white">
                      Most Popular
                    </span>
                  )}

                  <div>
                    <p className="mb-2 font-primary text-sm font-bold uppercase tracking-[0.06em] text-[var(--text-mid)]">
                      {plan.name}
                    </p>
                    <p className="mb-1 font-primary text-3xl font-bold tracking-[-0.04em] text-[var(--text)]">
                      {formatPrice(plan.price)}
                    </p>
                    <p className="font-primary text-xs text-[var(--text-muted)]">
                      {billingLabel(plan.billing)}
                    </p>
                  </div>

                  {plan.description && (
                    <p className="font-primary text-sm leading-relaxed text-[var(--text-muted)]">
                      {plan.description}
                    </p>
                  )}

                  {plan.features && plan.features.length > 0 && (
                    <ul className="flex flex-col gap-2">
                      {plan.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-2">
                          <CheckIcon />
                          <span className="font-primary text-sm text-[var(--text-muted)]">
                            {feat}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-auto">
                    <BuyNowButton
                      featured={isFeatured}
                      ctaState={ctaState}
                      parentPackUpsell={ctaState === "buy" && isTier ? parentPackUpsell : null}
                    />
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-sm text-[var(--text-muted)]">
            Pricing information unavailable. Please check back soon.
          </p>
        )}
      </main>

      <Footer />
    </>
  );
}
