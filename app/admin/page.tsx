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
      <h1 className="font-syne font-extrabold text-2xl tracking-[-0.02em] text-white mb-1">
        Overview
      </h1>
      <p className="text-[13px] text-white/40 mb-8">
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
