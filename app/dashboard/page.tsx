import { Suspense } from "react";
import { Greeting } from "@/components/dashboard/Greeting";
import { StartHereSection } from "@/components/dashboard/StartHereSection";
import { ContentCardsSection } from "@/components/dashboard/ContentCardsSection";
import { CommunitySectionWrapper } from "@/components/dashboard/CommunitySectionWrapper";
import { AccountStripSection } from "@/components/dashboard/AccountStripSection";
import { ParentInvitationWrapper } from "@/components/dashboard/ParentInvitationWrapper";
import { SectionErrorBoundary } from "@/components/ui/SectionErrorBoundary";
import { StartHereSkeleton } from "@/components/dashboard/skeletons/StartHereSkeleton";
import { ContentCardsSkeleton } from "@/components/dashboard/skeletons/ContentCardsSkeleton";
import { CommunitySectionSkeleton } from "@/components/dashboard/skeletons/CommunitySectionSkeleton";
import { AccountStripSkeleton } from "@/components/dashboard/skeletons/AccountStripSkeleton";
import { ParentInvitationSkeleton } from "@/components/dashboard/skeletons/ParentInvitationSkeleton";

// Main dashboard page — each section is wrapped in Suspense so it streams in
// independently. fetchDashboardAccess() is memoised with React.cache, so all
// section wrappers share a single Supabase round-trip per request.
// The layout shell (sidebar, mobile nav) renders before this page content begins.
export default function DashboardPage() {
  return (
    <>
      {/* Greeting fetches its own data and renders as part of the initial shell */}
      <Greeting />

      {/* Start Here — no error boundary: if it fails it silently disappears (null return) */}
      <Suspense fallback={<StartHereSkeleton />}>
        <StartHereSection />
      </Suspense>

      {/* Content Cards */}
      <p className="font-syne text-[13px] font-bold tracking-[0.06em] uppercase text-white/[0.42] mb-[14px] mt-9">
        Your Content
      </p>
      <SectionErrorBoundary label="Content cards">
        <Suspense fallback={<ContentCardsSkeleton />}>
          <ContentCardsSection />
        </Suspense>
      </SectionErrorBoundary>

      {/* Community */}
      <p className="font-syne text-[13px] font-bold tracking-[0.06em] uppercase text-white/[0.42] mb-[14px] mt-9">
        Community
      </p>
      <SectionErrorBoundary label="Community section">
        <Suspense fallback={<CommunitySectionSkeleton />}>
          <CommunitySectionWrapper />
        </Suspense>
      </SectionErrorBoundary>

      {/* Account */}
      <p className="font-syne text-[13px] font-bold tracking-[0.06em] uppercase text-white/[0.42] mb-[14px] mt-9">
        Account
      </p>
      <SectionErrorBoundary label="Account strip">
        <Suspense fallback={<AccountStripSkeleton />}>
          <AccountStripSection />
        </Suspense>
      </SectionErrorBoundary>

      {/* Parent invitation — only rendered for student accounts */}
      <SectionErrorBoundary label="Parent invitation">
        <Suspense fallback={<ParentInvitationSkeleton />}>
          <ParentInvitationWrapper />
        </Suspense>
      </SectionErrorBoundary>
    </>
  );
}
