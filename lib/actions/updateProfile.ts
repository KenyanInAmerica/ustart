"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAction } from "@/lib/audit/log";
import { AuditAction } from "@/lib/audit/actions";

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

type ProfileRow = {
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  university_name: string | null;
  country_of_origin: string | null;
};

export async function updateProfile(
  input: UpdateProfileInput
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Not authenticated." };

    // Validate phone before any DB work.
    let strippedPhone: string | undefined;
    if (input.phone_number !== undefined) {
      strippedPhone = input.phone_number.replace(/\s+/g, "");
      if (strippedPhone && !PHONE_REGEX.test(strippedPhone)) {
        return {
          success: false,
          error: "Please enter a valid international number e.g. +1 234 567 8900",
        };
      }
    }

    // Fetch current values so we can diff and only log what actually changed.
    const { data: currentData } = await supabase
      .from("profiles")
      .select("first_name, last_name, phone_number, university_name, country_of_origin")
      .eq("id", user.id)
      .maybeSingle();

    const current = (currentData ?? {}) as Partial<ProfileRow>;

    // Build update and payload simultaneously — only include fields that changed.
    const update: UpdateProfileInput = {};
    const changedFields: Record<string, { from: unknown; to: unknown }> = {};

    const trackField = (
      key: keyof UpdateProfileInput,
      incoming: string | undefined,
      currentVal: string | null | undefined
    ) => {
      if (incoming === undefined) return;
      if (incoming !== (currentVal ?? "")) {
        (update as Record<string, unknown>)[key] = incoming;
        changedFields[key] = { from: currentVal ?? null, to: incoming };
      }
    };

    trackField("first_name", input.first_name, current.first_name);
    trackField("last_name", input.last_name, current.last_name);
    trackField("university_name", input.university_name, current.university_name);
    trackField("country_of_origin", input.country_of_origin, current.country_of_origin);
    trackField("phone_number", strippedPhone, current.phone_number);

    // Nothing changed — skip the write entirely.
    if (Object.keys(update).length === 0) return { success: true };

    const { error } = await supabase
      .from("profiles")
      .update(update)
      .eq("id", user.id);

    if (error) return { success: false, error: error.message };

    void logAction({
      actorId: user.id,
      actorEmail: user.email ?? undefined,
      action: AuditAction.PROFILE_UPDATED,
      payload: { changedFields },
    });

    // Invalidate both routes so server components reflect the new data on next visit.
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/account");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
