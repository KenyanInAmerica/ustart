import { ContentCardsSection } from "@/components/dashboard/ContentCardsSection";

export default function DashboardContentPage() {
  return (
    <div className="bg-[var(--bg)]">
      <h1 className="mb-1 font-primary text-3xl font-bold tracking-tight text-[var(--text)]">
        My Content
      </h1>
      <p className="mb-8 font-primary text-sm text-[var(--text-muted)]">
        Access your UStart resources.
      </p>
      <ContentCardsSection />
    </div>
  );
}
