"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Records the timestamp of the user's first content page visit.
// Idempotent — reads first_content_visit_at before writing so repeated
// calls (e.g. across page navigations) never trigger an extra write.
// Fails silently so a Supabase error never breaks the content page render.
export async function trackContentVisit(): Promise<void> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    // Read first — skip the write if the timestamp is already set.
    const { data } = await supabase
      .from("profiles")
      .select("first_content_visit_at")
      .eq("id", user.id)
      .maybeSingle();

    const profile = data as { first_content_visit_at: string | null } | null;
    if (profile?.first_content_visit_at) return;

    await supabase
      .from("profiles")
      .update({ first_content_visit_at: new Date().toISOString() })
      .eq("id", user.id);

    // Invalidate the dashboard router cache so the next navigation back reflects
    // the updated first_content_visit_at without requiring a full page refresh.
    revalidatePath("/dashboard");
  } catch {
    // Non-critical tracking — never propagate errors to the caller.
  }
}
