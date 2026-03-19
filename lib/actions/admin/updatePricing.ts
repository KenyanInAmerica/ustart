// Server action for updating a pricing row in the admin settings page.
// Uses the service client to bypass RLS — admin-only operation.
// Revalidates the /admin/settings path after a successful save.

"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import type { BillingCadence } from "@/lib/config/pricing";

export interface UpdatePricingInput {
  name: string;
  description: string | null;
  price: number;
  billing: BillingCadence;
  features: string[] | null;
  is_public: boolean;
}

export async function updatePricing(
  id: string,
  input: UpdatePricingInput
): Promise<{ success: true } | { success: false; error: string }> {
  const service = createServiceClient();

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

  // Revalidate so the settings page reflects the updated data on next load.
  revalidatePath("/admin/settings");

  return { success: true };
}
