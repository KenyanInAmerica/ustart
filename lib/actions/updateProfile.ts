"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const PHONE_REGEX = /^\+[1-9]\d{6,14}$/;

// Partial profile update — only the fields present in the input are written.
// Returns a typed result object so callers can show inline errors without try/catch.
export interface UpdateProfileInput {
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  university_name?: string;
  country_of_origin?: string;
}

export async function updateProfile(
  input: UpdateProfileInput
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Not authenticated." };

    // Build the update object from whichever fields are present.
    const update: UpdateProfileInput = {};

    if (input.first_name !== undefined) update.first_name = input.first_name;
    if (input.last_name !== undefined) update.last_name = input.last_name;
    if (input.university_name !== undefined) update.university_name = input.university_name;
    if (input.country_of_origin !== undefined) update.country_of_origin = input.country_of_origin;

    if (input.phone_number !== undefined) {
      // Strip spaces before validating — allows formats like "+1 234 567 8900".
      const stripped = input.phone_number.replace(/\s+/g, "");
      // Allow clearing the field (empty string passes through); only validate non-empty values.
      if (stripped && !PHONE_REGEX.test(stripped)) {
        return {
          success: false,
          error: "Please enter a valid international number e.g. +1 234 567 8900",
        };
      }
      update.phone_number = stripped;
    }

    if (Object.keys(update).length === 0) return { success: true };

    const { error } = await supabase
      .from("profiles")
      .update(update)
      .eq("id", user.id);

    if (error) return { success: false, error: error.message };

    // Invalidate both routes so server components reflect the new data on next visit.
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/account");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
