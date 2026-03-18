import { redirect } from "next/navigation";
import { trackContentVisit } from "@/lib/actions/trackContentVisit";
import { fetchDashboardAccess } from "@/lib/dashboard/access";
import { fetchTierContent } from "@/lib/dashboard/content";
import { ContentGrid } from "@/components/dashboard/ContentGrid";
import { ParentInvitationSection } from "@/components/dashboard/ParentInvitationSection";

// Parent Pack content page.
// Server-side entitlement guard — requires has_parent_seat.
// For parent accounts, hasParentSeat is derived from the linked student's entitlements.
export default async function ParentPackPage() {
  const [access, items] = await Promise.all([
    fetchDashboardAccess(),
    fetchTierContent("parent_pack"),
    trackContentVisit(),
  ]);

  if (!access.hasParentSeat) redirect("/dashboard");

  return (
    <div>
      <h1 className="font-syne text-3xl font-bold tracking-tight text-white mb-1">
        Parent Pack
      </h1>
      <p className="font-dm-sans text-sm text-white/45 mb-8">
        Resources for supporting your student&apos;s US journey.
      </p>

      {/* PDF content grid — visible to both student and parent accounts */}
      <ContentGrid items={items} />

      {/* Invitation section — only shown to students who haven't yet linked a parent */}
      {access.role !== "parent" && (
        <div className="mt-10">
          <ParentInvitationSection
            initialStatus={access.parentInvitationStatus}
            initialParentEmail={access.invitedParentEmail}
          />
        </div>
      )}
    </div>
  );
}
