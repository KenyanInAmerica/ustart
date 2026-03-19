// Type definitions mirroring the public.pricing table shape.
// This file is for type safety only — never used as a data source.
// All live pricing data is fetched from Supabase via lib/config/getPricing.ts.

export type BillingCadence = "one-time" | "monthly" | "yearly";

export interface PricingItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  billing: BillingCadence;
  features: string[] | null;
  is_public: boolean;
  display_order: number;
  // Populated in Feature 12 when Stripe integration is complete.
  stripe_product_id: string | null;
  stripe_price_id: string | null;
  updated_at: string;
}

export type TierId = "lite" | "pro" | "premium";
export type AddonId = "parent_pack" | "explore" | "concierge";
export type ProductId = TierId | AddonId;
