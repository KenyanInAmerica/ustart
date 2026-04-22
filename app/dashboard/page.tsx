import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { PlanView } from "@/components/dashboard/PlanView";
import { ParentInvitationWrapper } from "@/components/dashboard/ParentInvitationWrapper";
import { fetchUserPlan } from "@/lib/dashboard/plan";
import { ParentInvitationSkeleton } from "@/components/dashboard/skeletons/ParentInvitationSkeleton";
import { SectionErrorBoundary } from "@/components/ui/SectionErrorBoundary";

function getTimeOfDay(): "morning" | "afternoon" | "evening" {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profileData }, planGroups] = await Promise.all([
    supabase
      .from("profiles")
      .select("first_name, intake_completed_at")
      .eq("id", user!.id)
      .maybeSingle(),
    fetchUserPlan(user!.id),
  ]);

  const profile = profileData as {
    first_name: string | null;
    intake_completed_at: string | null;
  } | null;
  const firstName = profile?.first_name ?? null;
  const timeOfDay = getTimeOfDay();

  return (
    <PlanView
      greeting={`Good ${timeOfDay}${firstName ? `, ${firstName}` : ""}.`}
      subtitle="Here's your UStart plan."
      initialPhaseGroups={planGroups}
      intakeCompletedAt={profile?.intake_completed_at ?? null}
    >
      <SectionErrorBoundary label="Parent invitation">
        <Suspense fallback={<ParentInvitationSkeleton />}>
          <ParentInvitationWrapper />
        </Suspense>
      </SectionErrorBoundary>
    </PlanView>
  );
}
