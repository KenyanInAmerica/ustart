"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { instantiatePlan } from "@/lib/actions/plan";
import { trackHubSpotContact, toHubSpotDate } from "@/lib/hubspot/contacts";
import { getHubSpotEnvironment } from "@/lib/hubspot/client";
import { GRADUATION_TIMELINE_OPTIONS, MAIN_CONCERN_OPTIONS } from "@/lib/config/intakeOptions";
import type { IntakeFormData } from "@/lib/types/intake";

type IntakeResult =
  | { success: true }
  | { success: true; alreadyCompleted: true }
  | { success: false; error: string };

type ProfileIntakeRow = {
  intake_completed_at: string | null;
};

const ALLOWED_CONCERNS: Set<string> = new Set(MAIN_CONCERN_OPTIONS.map((o) => o.value));
const ALLOWED_GRADUATION_TIMELINES: Set<string> = new Set(
  GRADUATION_TIMELINE_OPTIONS.map((o) => o.value)
);

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

    if (!ALLOWED_GRADUATION_TIMELINES.has(graduationDate)) {
      return { success: false, error: "Graduation timeline is invalid." };
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
        university_name: school,
        school,
        city,
        arrival_date: arrivalDate,
        graduation_date: graduationDate,
        intake_completed_at: completedAt,
      })
      .eq("id", user.id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    trackHubSpotContact({
      email: user.email ?? "",
      lifecyclestage: "lead",
      hs_lead_status: "IN_PROGRESS",
      ustart_environment: getHubSpotEnvironment(),
      ustart_intake_completed: true,
      ustart_city: city,
      ustart_school: school,
      ustart_arrival_date: toHubSpotDate(arrivalDate),
      ustart_graduation_timeline: graduationDate,
      ustart_main_concerns: serializedConcerns,
    });

    void instantiatePlan(user.id);

    revalidatePath("/intake");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

type UpdateIntakeResult =
  | { success: true; arrivalDateChanged: boolean }
  | { success: false; error: string };

export async function updateIntake(
  data: Partial<IntakeFormData>
): Promise<UpdateIntakeResult> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Not authenticated." };

    // Fetch the current arrival_date before updating so we can detect a change.
    const { data: currentProfile, error: profileFetchError } = await supabase
      .from("profiles")
      .select("arrival_date")
      .eq("id", user.id)
      .maybeSingle();

    if (profileFetchError) {
      return { success: false, error: profileFetchError.message };
    }

    const prevArrivalDate =
      (currentProfile as { arrival_date: string | null } | null)?.arrival_date ??
      null;

    // Build partial profile update from provided fields.
    const profileUpdate: Record<string, unknown> = {};
    if (data.school !== undefined) {
      const school = normalizeText(data.school);
      if (!school) return { success: false, error: "School is required." };
      profileUpdate.school = school;
      profileUpdate.university_name = school;
    }
    if (data.city !== undefined) {
      const city = normalizeText(data.city);
      if (!city) return { success: false, error: "City is required." };
      profileUpdate.city = city;
    }
    if (data.arrival_date !== undefined) {
      if (!isValidDateOnly(data.arrival_date)) {
        return { success: false, error: "Arrival date is invalid." };
      }
      profileUpdate.arrival_date = data.arrival_date;
    }
    if (data.graduation_date !== undefined) {
      if (!ALLOWED_GRADUATION_TIMELINES.has(data.graduation_date)) {
        return { success: false, error: "Graduation timeline is invalid." };
      }
      profileUpdate.graduation_date = data.graduation_date;
    }

    const arrivalDateChanged =
      data.arrival_date !== undefined &&
      data.arrival_date !== prevArrivalDate;

    if (Object.keys(profileUpdate).length > 0) {
      const service = createServiceClient();
      const { error: updateError } = await service
        .from("profiles")
        .update(profileUpdate)
        .eq("id", user.id);

      if (updateError) return { success: false, error: updateError.message };
    }

    // Build partial intake_responses update from provided fields.
    const intakeUpdate: Record<string, unknown> = {};
    if (data.school !== undefined) intakeUpdate.school = normalizeText(data.school);
    if (data.city !== undefined) intakeUpdate.city = normalizeText(data.city);
    if (data.arrival_date !== undefined) intakeUpdate.arrival_date = data.arrival_date;
    if (data.graduation_date !== undefined) intakeUpdate.graduation_date = data.graduation_date;
    if (data.main_concerns !== undefined) {
      if (data.main_concerns.length === 0) {
        return { success: false, error: "Please select at least one main concern." };
      }
      if (data.main_concerns.some((c) => !ALLOWED_CONCERNS.has(c))) {
        return { success: false, error: "Main concerns include an invalid option." };
      }
      const otherConcern = normalizeText(data.other_concern ?? "");
      if (data.main_concerns.includes("other") && !otherConcern) {
        return { success: false, error: "Please tell us more about your other concern." };
      }
      const serialized = serializeConcerns(
        Array.from(new Set(data.main_concerns)),
        otherConcern
      ).replaceAll(", ", ",");
      intakeUpdate.main_concerns = serialized;
    }

    if (Object.keys(intakeUpdate).length > 0) {
      const { error: intakeError } = await supabase
        .from("intake_responses")
        .update(intakeUpdate)
        .eq("user_id", user.id);

      if (intakeError) return { success: false, error: intakeError.message };
    }

    // Fire-and-forget HubSpot update for changed fields.
    const hsUpdate: Record<string, unknown> = {
      email: user.email ?? "",
      ustart_environment: getHubSpotEnvironment(),
    };
    if (data.school !== undefined) hsUpdate.ustart_school = normalizeText(data.school);
    if (data.city !== undefined) hsUpdate.ustart_city = normalizeText(data.city);
    if (data.arrival_date !== undefined)
      hsUpdate.ustart_arrival_date = toHubSpotDate(data.arrival_date);
    if (data.graduation_date !== undefined)
      hsUpdate.ustart_graduation_timeline = data.graduation_date;
    if (data.main_concerns !== undefined) {
      const otherConcern = normalizeText(data.other_concern ?? "");
      hsUpdate.ustart_main_concerns = serializeConcerns(
        Array.from(new Set(data.main_concerns)),
        otherConcern
      );
    }
    trackHubSpotContact(hsUpdate as unknown as Parameters<typeof trackHubSpotContact>[0]);

    revalidatePath("/dashboard/account");
    return { success: true, arrivalDateChanged };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
