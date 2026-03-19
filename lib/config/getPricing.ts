// Server-side pricing fetch utilities.
// All exports use React.cache() so multiple callers in the same render pass
// share a single Supabase round-trip — no memoisation needed at call sites.

import { cache } from "react";
import { createServiceClient } from "@/lib/supabase/service";
import type { PricingItem, ProductId } from "./pricing";

// Fetch all products ordered by display_order.
export const getPricing = cache(async (): Promise<PricingItem[]> => {
  const service = createServiceClient();
  const { data } = await service
    .from("pricing")
    .select("*")
    .order("display_order", { ascending: true });
  return (data ?? []) as PricingItem[];
});

// Fetch only publicly listed products (Lite, Pro, Premium).
export const getPublicPricing = cache(async (): Promise<PricingItem[]> => {
  const service = createServiceClient();
  const { data } = await service
    .from("pricing")
    .select("*")
    .eq("is_public", true)
    .order("display_order", { ascending: true });
  return (data ?? []) as PricingItem[];
});

// Fetch a single product by its ID. Returns null if not found.
export const getPricingById = cache(
  async (id: ProductId): Promise<PricingItem | null> => {
    const service = createServiceClient();
    const { data } = await service
      .from("pricing")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    return data as PricingItem | null;
  }
);
