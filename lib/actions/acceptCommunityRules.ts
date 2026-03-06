"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const PHONE_REGEX = /^\+[1-9]\d{6,14}$/;

// Records community rule acceptance and stores the user's WhatsApp number.
// Returns a typed result object rather than throwing so the client component
// can display inline errors without try/catch boilerplate.
export async function acceptCommunityRules(
  phoneNumber: string
): Promise<{ success: true } | { success: false; error: string }> {
  const stripped = phoneNumber.replace(/\s+/g, "");
  if (!PHONE_REGEX.test(stripped)) {
    return {
      success: false,
      error: "Please enter a valid international number e.g. +1 234 567 8900",
    };
  }

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Not authenticated." };

    // Store the stripped number (no spaces) on the user's profile row.
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ phone_number: stripped })
      .eq("id", user.id);

    if (profileError) return { success: false, error: profileError.message };

    // Insert the agreement row — upsert ignores duplicates so repeated calls
    // (e.g. if the user somehow reaches this flow twice) are safe.
    const { error: agreementError } = await supabase
      .from("community_agreements")
      .upsert({ user_id: user.id }, { onConflict: "user_id", ignoreDuplicates: true });

    if (agreementError) return { success: false, error: agreementError.message };

    // Invalidate the dashboard so the next navigation reflects the updated state.
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
