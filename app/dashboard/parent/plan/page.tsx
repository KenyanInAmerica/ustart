import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { fetchUserPlan } from "@/lib/dashboard/plan";
import { PlanView } from "@/components/dashboard/PlanView";
import { PlanCalendar } from "@/components/dashboard/PlanCalendar";

type ParentProfileRow = {
  role: "student" | "parent" | null;
  student_id: string | null;
};

export default async function ParentPlanPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const service = createServiceClient();
  const { data: parentProfileData } = await service
    .from("profiles")
    .select("role, student_id")
    .eq("id", user.id)
    .maybeSingle();

  const parentProfile = parentProfileData as ParentProfileRow | null;

  if (parentProfile?.role !== "parent") redirect("/dashboard");

  if (!parentProfile.student_id) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-white p-8 text-center">
        <p className="mb-1 font-medium text-[var(--text)]">No student linked</p>
        <p className="text-sm text-[var(--text-muted)]">
          This parent account is not linked to a student yet.
        </p>
      </div>
    );
  }

  const [{ data: studentProfileData }, { data: sharingData }] = await Promise.all([
    service
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", parentProfile.student_id)
      .maybeSingle(),
    service
      .from("parent_invitations")
      .select("share_tasks, share_calendar")
      .eq("student_id", parentProfile.student_id)
      .eq("status", "accepted")
      .maybeSingle(),
  ]);

  const studentProfile = studentProfileData as {
    first_name: string | null;
    last_name: string | null;
  } | null;
  const sharing = sharingData as {
    share_tasks: boolean | null;
    share_calendar: boolean | null;
  } | null;

  const studentFirstName = studentProfile?.first_name ?? "Your student";
  const shareTasks = sharing?.share_tasks !== false;
  const shareCalendar = sharing?.share_calendar !== false;
  const planData = shareTasks || shareCalendar
    ? await fetchUserPlan(parentProfile.student_id, { bypassRls: true })
    : [];

  const calendarFallback = (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-white p-8 text-center">
      <p className="mb-1 font-medium text-[var(--text)]">
        {studentFirstName} hasn&apos;t shared their calendar with you yet.
      </p>
      <p className="text-sm text-[var(--text-muted)]">
        Ask them to update their sharing settings from their Parent Pack page.
      </p>
    </div>
  );

  if (!shareTasks) {
    return (
      <div className="grid gap-6 md-900:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-white p-8 text-center">
          <p className="mb-1 font-medium text-[var(--text)]">
            {studentFirstName} hasn&apos;t shared their plan with you yet.
          </p>
          <p className="text-sm text-[var(--text-muted)]">
            Ask them to update their sharing settings from their Parent Pack page.
          </p>
        </div>
        <aside>{shareCalendar ? <PlanCalendar tasks={planData.flatMap((group) => group.tasks)} /> : calendarFallback}</aside>
      </div>
    );
  }

  return (
    <PlanView
      greeting={`${studentFirstName}'s Plan`}
      subtitle="A read-only view of your student's UStart plan."
      initialPhaseGroups={planData}
      intakeCompletedAt={null}
      readOnly
      calendarContent={shareCalendar ? undefined : calendarFallback}
    />
  );
}
