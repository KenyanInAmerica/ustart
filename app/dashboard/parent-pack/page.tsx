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
    <div className="bg-[var(--bg)]">
      <h1 className="mb-1 font-primary text-3xl font-bold tracking-tight text-[var(--text)]">
        Parent Pack
      </h1>
      <p className="mb-8 font-primary text-sm text-[var(--text-muted)]">
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
