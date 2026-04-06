// Server action for updating a pricing row in the admin settings page.
// Uses the service client to bypass RLS — admin-only operation.
// Revalidates the /admin/settings path after a successful save.

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { logAction } from "@/lib/audit/log";
import { AuditAction } from "@/lib/audit/actions";
import type { BillingCadence } from "@/lib/config/pricing";

export interface UpdatePricingInput {
  name: string;
  description: string | null;
  price: number;
  billing: BillingCadence;
  features: string[] | null;
  is_public: boolean;
}

type PricingRow = {
  name: string;
  description: string | null;
  price: number;
  billing: BillingCadence;
  features: string[] | null;
  is_public: boolean;
};

export async function updatePricing(
  id: string,
  input: UpdatePricingInput
): Promise<{ success: true } | { success: false; error: string }> {
  // Resolve the caller for the audit log.
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const service = createServiceClient();

  // Fetch current values so the log payload reflects only what actually changed.
  const { data: currentData } = await service
    .from("pricing")
    .select("name, description, price, billing, features, is_public")
    .eq("id", id)
    .maybeSingle();
  const current = (currentData ?? {}) as Partial<PricingRow>;

  const { error } = await service
    .from("pricing")
    .update({
      name: input.name,
      description: input.description,
      price: input.price,
      billing: input.billing,
      features: input.features,
      is_public: input.is_public,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  // Build a diff of only the fields that changed.
  const changedFields: Record<string, { from: unknown; to: unknown }> = {};
  const keys = ["name", "description", "price", "billing", "features", "is_public"] as const;
  for (const key of keys) {
    // JSON-stringify for a stable deep comparison (handles arrays like features).
    if (JSON.stringify(current[key]) !== JSON.stringify(input[key])) {
      changedFields[key] = { from: current[key] ?? null, to: input[key] };
    }
  }

  void logAction({
    actorId: user?.id,
    actorEmail: user?.email ?? undefined,
    action: AuditAction.ADMIN_PRICING_UPDATED,
    payload: { productId: id, changedFields },
  });

  // Revalidate so the settings page reflects the updated data on next load.
  revalidatePath("/admin/settings");

  return { success: true };
}
