// Type definitions mirroring the public.pricing table shape.
// This file is for type safety only — never used as a data source.
// All live pricing data is fetched from Supabase via lib/config/getPricing.ts.

export type BillingType = "one-time" | "monthly" | "yearly";
export type BillingCadence = BillingType;

export interface PricingItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  billing: BillingType;
  features: string[] | null;
  is_public: boolean;
  display_order: number;
  // Populated in Feature 12 when Stripe integration is complete.
  stripe_product_id: string | null;
  stripe_price_id: string | null;
  updated_at: string;
}

export type TierId = "lite" | "explore" | "concierge";
export type AddonId = "arrival_call" | "additional_support_call";
export type ProductId =
  | TierId
  | "parent_pack"
  | "arrival_call"
  | "additional_support_call";

export type CallBookingType = "arrival_call" | "additional_support_call";

export type CallBookingStatus =
  | "purchased"
  | "booked"
  | "completed"
  | "cancelled";

export interface CallBooking {
  id: string;
  user_id: string;
  type: CallBookingType;
  status: CallBookingStatus;
  stripe_payment_intent_id: string | null;
  calendly_event_id: string | null;
  booked_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}
