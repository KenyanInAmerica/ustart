import { ContentCards } from "@/components/dashboard/ContentCards";
import { fetchParentStudentContext } from "@/lib/dashboard/parent";
import type { DashboardAccess } from "@/types";

export default async function ParentContentPage() {
  const context = await fetchParentStudentContext();

  if (!context.studentId) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-white p-8 text-center">
        <p className="mb-1 font-medium text-[var(--text)]">No student linked</p>
        <p className="text-sm text-[var(--text-muted)]">
          This parent account is not linked to a student yet.
        </p>
      </div>
    );
  }

  const parentContentAccess: DashboardAccess = {
    membershipRank: context.membershipRank,
    membershipTier: context.membershipTier,
    hasMembership: context.membershipRank > 0,
    hasParentSeat: false,
    hasExplore: context.membershipRank >= 2,
    hasConcierge: context.membershipRank >= 3,
    hasAgreedToCommunity: false,
    hasAccessedContent: false,
    phoneNumber: null,
    membershipPurchasedAt: null,
    invitedParentEmail: null,
    parentInvitationStatus: "accepted",
    parentInvitationAcceptedAt: null,
    parentShareTasks: context.shareTasks,
    parentShareCalendar: context.shareCalendar,
    parentShareContent: context.shareContent,
    role: "parent",
  };

  return (
    <div className="bg-[var(--bg)]">
      <h1 className="mb-1 font-primary text-3xl font-bold tracking-tight text-[var(--text)]">
        {context.studentFirstName}&apos;s Content
      </h1>
      <p className="mb-8 font-primary text-sm text-[var(--text-muted)]">
        Content your student has access to.
      </p>

      {!context.shareContent ? (
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-white p-8 text-center">
          <p className="mb-1 font-medium text-[var(--text)]">
            {context.studentFirstName} hasn&apos;t shared their content with you yet.
          </p>
          <p className="text-sm text-[var(--text-muted)]">
            Ask them to update their sharing settings from their Parent Pack page.
          </p>
        </div>
      ) : (
        <ContentCards
          access={parentContentAccess}
          hrefOverrides={{
            lite: "/dashboard/parent/content/lite",
            explore: "/dashboard/parent/content/explore",
            concierge: "/dashboard/parent/content/concierge",
          }}
          includeParentPack={false}
          lockedHref={null}
        />
      )}
    </div>
  );
}
