import { redirect } from "next/navigation";
import { trackContentVisit } from "@/lib/actions/trackContentVisit";
import { fetchDashboardAccess } from "@/lib/dashboard/access";
import { ParentInvitationSection } from "@/components/dashboard/ParentInvitationSection";

export default async function ParentPackPage() {
  const [access] = await Promise.all([
    fetchDashboardAccess(),
    trackContentVisit(),
  ]);

  // Server-side entitlement guard — Parent Pack requires has_parent_seat.
  // For parent accounts, hasParentSeat is derived from the linked student's entitlements.
  if (!access.hasParentSeat) redirect("/dashboard");

  return (
    <div>
      {/* Parent Resources content — visible to all roles */}
      <h1 className="font-syne text-3xl font-bold tracking-tight text-white mb-4">
        Parent Pack
      </h1>
      <div className="bg-[#0C1220] border border-white/[0.07] rounded-2xl p-5 mb-6">
        <p className="font-syne text-sm font-bold text-white mb-3">Parent Resources</p>
        <p className="font-dm-sans text-sm text-white/[0.54]">
          Your parent content will appear here.
        </p>
      </div>

      {/* Invitation section — only shown to students, not to parent accounts */}
      {access.role !== "parent" && (
        <ParentInvitationSection
          initialStatus={access.parentInvitationStatus}
          initialParentEmail={access.invitedParentEmail}
        />
      )}
    </div>
  );
}
