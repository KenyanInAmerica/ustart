import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchDashboardAccess } from "@/lib/dashboard/access";
import { fetchParentPackLinks } from "@/lib/dashboard/parentPack";
import { ParentPackManager } from "@/components/dashboard/ParentPackManager";

export default async function ParentPackPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const [access, links] = await Promise.all([
    fetchDashboardAccess(),
    fetchParentPackLinks(),
  ]);

  if (access.role === "parent") redirect("/dashboard/parent/hub");
  if (!access.hasParentSeat) redirect("/dashboard");

  return (
    <div className="bg-[var(--bg)]">
      <h1 className="mb-1 font-primary text-3xl font-bold tracking-tight text-[var(--text)]">
        Parent Pack
      </h1>
      <p className="mb-8 font-primary text-sm text-[var(--text-muted)]">
        Manage how a parent supports your UStart journey.
      </p>

      <ParentPackManager
        initialStatus={access.parentInvitationStatus}
        initialParentEmail={access.invitedParentEmail}
        initialPreferences={{
          share_tasks: access.parentShareTasks,
          share_calendar: access.parentShareCalendar,
          share_content: access.parentShareContent,
        }}
        parentPackNotionUrl={links.parentPackNotionUrl}
      />
    </div>
  );
}
