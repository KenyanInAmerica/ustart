import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fetchDashboardAccess } from "@/lib/dashboard/access";
import { getTaskForContentUrl } from "@/lib/dashboard/plan";
import { getNotionChildPages, getNotionBlocks, fetchToggleChildren } from "@/lib/notion/fetcher";
import { NOTION_PAGE_IDS } from "@/lib/notion/config";
import { PLAN_PHASE_COLORS } from "@/lib/types/plan";
import { NotionRenderer } from "@/components/notion/NotionRenderer";
import { TaskStatusWidget } from "@/components/dashboard/TaskStatusWidget";

export default async function ConciergeModulePage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { from?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const [access, modules] = await Promise.all([
    fetchDashboardAccess(),
    getNotionChildPages(NOTION_PAGE_IDS.concierge),
  ]);

  if (access.role === "parent") redirect("/dashboard/parent/content");
  if (access.membershipRank < 3) redirect("/dashboard/content");

  const currentModule = modules.find((m) => m.slug === params.slug);
  if (!currentModule) return notFound();

  const contentPath = `/dashboard/content/concierge/${params.slug}`;

  const [blocks, matchingTask] = await Promise.all([
    getNotionBlocks(currentModule.id),
    getTaskForContentUrl(user.id, contentPath),
  ]);

  const toggleChildren = await fetchToggleChildren(blocks);

  const currentIndex = modules.findIndex((m) => m.slug === params.slug);
  const prevModule = modules[currentIndex - 1] ?? null;
  const nextModule = modules[currentIndex + 1] ?? null;

  return (
    <div>
      {searchParams.from === "plan" && (
        <Link
          href="/dashboard"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
        >
          ← Back to My Plan
        </Link>
      )}

      {matchingTask && (
        <TaskStatusWidget
          task={matchingTask}
          phaseColor={PLAN_PHASE_COLORS[matchingTask.phase]}
        />
      )}

      <h1 className="font-primary font-bold text-2xl text-[var(--text)] mb-6">
        {currentModule.title}
      </h1>

      <NotionRenderer blocks={blocks} toggleChildren={toggleChildren} />

      <div className="flex items-center justify-between mt-12 pt-6 border-t border-[var(--border)]">
        <div>
          {prevModule && (
            <Link
              href={`/dashboard/content/concierge/${prevModule.slug}`}
              className="flex items-center gap-2 text-[var(--text-muted)] text-sm hover:text-[var(--text)]"
            >
              ← {prevModule.title}
            </Link>
          )}
        </div>
        <div>
          {nextModule && (
            <Link
              href={`/dashboard/content/concierge/${nextModule.slug}`}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-white rounded-[var(--radius-sm)] text-sm hover:bg-[var(--accent-hover)]"
            >
              {nextModule.title} →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
