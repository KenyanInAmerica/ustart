import { redirect } from "next/navigation";
import { fetchParentStudentContext } from "@/lib/dashboard/parent";
import { getNotionChildPages } from "@/lib/notion/fetcher";
import { NOTION_PAGE_IDS } from "@/lib/notion/config";
import { NotionSidebar } from "@/components/notion/NotionSidebar";

export default async function ParentConciergeModuleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  const context = await fetchParentStudentContext();

  if (!context.studentId) redirect("/dashboard/parent/content");
  if (!context.shareContent) redirect("/dashboard/parent/content");
  if (context.membershipRank < 3) redirect("/dashboard/parent/content");

  const modules = await getNotionChildPages(NOTION_PAGE_IDS.concierge);

  return (
    <div className="min-[860px]:flex min-[860px]:min-h-0 -mx-5 min-[860px]:-mx-[56px]">
      <NotionSidebar
        modules={modules}
        currentSlug={params.slug}
        tier="concierge"
        tierLabel="UStart Concierge"
        backHref="/dashboard/parent/content"
        backLabel="← My Student's Content"
        moduleBasePath="/dashboard/parent/content/concierge"
      />
      <div className="flex-1 min-w-0 px-5 py-0 min-[860px]:px-12 min-[860px]:py-2">
        {children}
      </div>
    </div>
  );
}
