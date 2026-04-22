import { CommunitySectionWrapper } from "@/components/dashboard/CommunitySectionWrapper";

export default function DashboardCommunityPage() {
  return (
    <div className="bg-[var(--bg)]">
      <h1 className="mb-1 font-primary text-3xl font-bold tracking-tight text-[var(--text)]">
        Community
      </h1>
      <p className="mb-8 font-primary text-sm text-[var(--text-muted)]">
        Connect with the UStart member community.
      </p>
      <CommunitySectionWrapper />
    </div>
  );
}
