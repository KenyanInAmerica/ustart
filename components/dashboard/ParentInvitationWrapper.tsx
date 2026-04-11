// Async Server Component wrapper for ParentInvitationSection.
// Returns null for parent accounts — the invitation flow is only for students
// who want to give a parent access to their UStart account.

import { fetchDashboardAccess } from "@/lib/dashboard/access";
import { ParentInvitationSection } from "@/components/dashboard/ParentInvitationSection";

export async function ParentInvitationWrapper() {
  const access = await fetchDashboardAccess();

  // Parent accounts don't invite other parents — only students use this flow.
  if (access.role !== "student") return null;

  return (
    <ParentInvitationSection
      initialStatus={access.parentInvitationStatus}
      initialParentEmail={access.invitedParentEmail}
    />
  );
}
