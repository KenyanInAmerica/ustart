import { getNotionChildPages } from "@/lib/notion/fetcher";
import { NOTION_PAGE_IDS } from "@/lib/notion/config";
import { NotionSidebar } from "@/components/notion/NotionSidebar";

export default async function ConciergeModuleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  const modules = await getNotionChildPages(NOTION_PAGE_IDS.concierge);

  return (
    <div className="min-[860px]:flex min-[860px]:min-h-0 -mx-5 min-[860px]:-mx-[56px]">
      <NotionSidebar
        modules={modules}
        currentSlug={params.slug}
        tier="concierge"
        tierLabel="UStart Concierge"
      />
      <div className="flex-1 min-w-0 px-5 py-0 min-[860px]:px-12 min-[860px]:py-2">
        {children}
      </div>
    </div>
  );
}
