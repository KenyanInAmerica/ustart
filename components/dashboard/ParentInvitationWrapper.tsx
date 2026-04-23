// Async Server Component wrapper for the dashboard home.
// Keeps the plan page lightweight by linking students out to the full Parent Pack page.

import Link from "next/link";
import { fetchDashboardAccess } from "@/lib/dashboard/access";
import { Card } from "@/components/ui/Card";

export async function ParentInvitationWrapper() {
  const access = await fetchDashboardAccess();

  if (access.role !== "student" || !access.hasParentSeat) return null;

  const summary =
    access.parentInvitationStatus === "accepted"
      ? `Connected to ${access.invitedParentEmail ?? "your parent"}.`
      : access.parentInvitationStatus === "pending"
        ? `Invitation sent to ${access.invitedParentEmail ?? "your parent"}.`
        : "Invite a parent and choose what they can see.";

  return (
    <Card className="border border-[var(--border)]" padding="md">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-primary text-sm font-semibold text-[var(--text)]">
            Parent Pack
          </p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{summary}</p>
        </div>
        <Link
          href="/dashboard/content/parent-pack"
          className="inline-flex min-h-9 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--accent)] px-3.5 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[var(--accent-hover)]"
        >
          Manage Parent Pack
        </Link>
      </div>
    </Card>
  );
}
