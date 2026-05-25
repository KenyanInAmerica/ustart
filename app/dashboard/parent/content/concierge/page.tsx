import { redirect } from "next/navigation";
import { fetchParentStudentContext } from "@/lib/dashboard/parent";
import { getNotionChildPages } from "@/lib/notion/fetcher";
import { NOTION_PAGE_IDS } from "@/lib/notion/config";

export default async function ParentConciergeContentPage() {
  const context = await fetchParentStudentContext();

  if (!context.studentId) redirect("/dashboard/parent/content");
  if (!context.shareContent) redirect("/dashboard/parent/content");
  if (context.membershipRank < 3) redirect("/dashboard/parent/content");

  const modules = await getNotionChildPages(NOTION_PAGE_IDS.concierge);

  if (modules.length > 0) {
    redirect(`/dashboard/parent/content/concierge/${modules[0].slug}`);
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-white p-8 text-center">
      <p className="mb-1 font-medium text-[var(--text)]">Content coming soon</p>
      <p className="text-sm text-[var(--text-muted)]">
        UStart Concierge modules are being prepared.
      </p>
    </div>
  );
}
