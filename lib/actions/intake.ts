"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { IntakeFormData } from "@/lib/types/intake";

type IntakeResult =
  | { success: true }
  | { success: true; alreadyCompleted: true }
  | { success: false; error: string };

type ProfileIntakeRow = {
  intake_completed_at: string | null;
};

const ALLOWED_CONCERNS = new Set([
  "banking_credit",
  "ssn",
  "housing",
  "transportation",
  "health_insurance",
  "tax_finance",
  "campus_life",
  "community_social",
  "other",
]);

function isValidDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function normalizeText(value: string): string {
  return value.trim();
}

function serializeConcerns(mainConcerns: string[], otherConcern?: string): string {
  return mainConcerns
    .map((concern) =>
      concern === "other" && otherConcern
        ? `other: ${otherConcern}`
        : concern
    )
    .join(", ");
}

export async function submitIntake(formData: IntakeFormData): Promise<IntakeResult> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated." };
    }

    const school = normalizeText(formData.school);
    const city = normalizeText(formData.city);
    const arrivalDate = formData.arrival_date;
    const graduationDate = formData.graduation_date;
    const selectedConcerns = Array.from(
      new Set(formData.main_concerns.map((concern) => concern.trim()).filter(Boolean))
    );
    const otherConcern = normalizeText(formData.other_concern ?? "");

    if (!school) {
      return { success: false, error: "School is required." };
    }

    if (!city) {
      return { success: false, error: "City is required." };
    }

    if (!isValidDateOnly(arrivalDate)) {
      return { success: false, error: "Arrival date is invalid." };
    }

    if (!isValidDateOnly(graduationDate)) {
      return { success: false, error: "Graduation date is invalid." };
    }

    if (graduationDate <= arrivalDate) {
      return {
        success: false,
        error: "Graduation date must be after arrival date.",
      };
    }

    if (selectedConcerns.length === 0) {
      return {
        success: false,
        error: "Please select at least one main concern.",
      };
    }

    if (selectedConcerns.some((concern) => !ALLOWED_CONCERNS.has(concern))) {
      return {
        success: false,
        error: "Main concerns include an invalid option.",
      };
    }

    if (selectedConcerns.includes("other") && !otherConcern) {
      return {
        success: false,
        error: "Please tell us more about your other concern.",
      };
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("intake_completed_at")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      return { success: false, error: profileError.message };
    }

    const profile = profileData as ProfileIntakeRow | null;

    if (profile?.intake_completed_at) {
      return { success: true, alreadyCompleted: true };
    }

    const completedAt = new Date().toISOString();
    const serializedConcerns = serializeConcerns(selectedConcerns, otherConcern);

    const { error: intakeError } = await supabase.from("intake_responses").insert({
      user_id: user.id,
      school,
      city,
      arrival_date: arrivalDate,
      graduation_date: graduationDate,
      main_concerns: serializedConcerns.replaceAll(", ", ","),
      completed_at: completedAt,
    });

    if (intakeError) {
      return { success: false, error: intakeError.message };
    }

    const service = createServiceClient();
    const { error: updateError } = await service
      .from("profiles")
      .update({
        city,
        arrival_date: arrivalDate,
        graduation_date: graduationDate,
        intake_completed_at: completedAt,
      })
      .eq("id", user.id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    revalidatePath("/intake");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
