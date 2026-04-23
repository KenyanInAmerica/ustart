import { redirect } from "next/navigation";
import { fetchTierContent } from "@/lib/dashboard/content";
import { fetchParentStudentContext } from "@/lib/dashboard/parent";
import { ContentGrid } from "@/components/dashboard/ContentGrid";

export default async function ParentExploreContentPage() {
  const context = await fetchParentStudentContext();

  if (!context.studentId) redirect("/dashboard/parent/content");
  if (!context.shareContent) redirect("/dashboard/parent/content");
  if (context.membershipRank < 2) redirect("/dashboard/parent/content");

  const items = await fetchTierContent("explore");

  return (
    <div className="bg-[var(--bg)]">
      <div className="mb-4 rounded-[var(--radius-sm)] border border-[var(--accent)]/20 bg-[var(--accent)]/5 px-4 py-2 text-sm text-[var(--accent)]">
        You&apos;re viewing {context.studentFirstName}&apos;s content
      </div>
      <h1 className="mb-1 font-primary text-3xl font-bold tracking-tight text-[var(--text)]">
        UStart Explore
      </h1>
      <p className="mb-8 font-primary text-sm text-[var(--text-muted)]">
        Everything in Lite plus deeper guides to help you settle in and thrive.
      </p>
      <ContentGrid items={items} />
    </div>
  );
}
