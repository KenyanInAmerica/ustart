// Admin overview page — shell renders immediately; stats and signups stream in.
// Server Component: no client state needed.

import { Suspense } from "react";
import { AdminStatsSection } from "@/components/admin/AdminStatsSection";
import { RecentSignupsSection } from "@/components/admin/RecentSignupsSection";
import { AdminStatsSkeleton } from "@/components/admin/skeletons/AdminStatsSkeleton";
import { RecentSignupsSkeleton } from "@/components/admin/skeletons/RecentSignupsSkeleton";
import { SectionErrorBoundary } from "@/components/ui/SectionErrorBoundary";

export default function AdminOverviewPage() {
  return (
    <div className="px-8 py-8 max-w-5xl">
      <h1 className="mb-1 font-primary text-2xl font-extrabold tracking-[-0.02em] text-[var(--text)]">
        Overview
      </h1>
      <p className="mb-8 text-[13px] text-[var(--text-muted)]">
        Platform snapshot — live data from the database.
      </p>

      {/* Stat cards + members-by-tier */}
      <SectionErrorBoundary label="Admin stats">
        <Suspense fallback={<AdminStatsSkeleton />}>
          <AdminStatsSection />
        </Suspense>
      </SectionErrorBoundary>

      {/* Recent signups table */}
      <SectionErrorBoundary label="Recent signups">
        <Suspense fallback={<RecentSignupsSkeleton />}>
          <RecentSignupsSection />
        </Suspense>
      </SectionErrorBoundary>
    </div>
  );
}
