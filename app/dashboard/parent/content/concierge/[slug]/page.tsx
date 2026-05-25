import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { fetchParentStudentContext } from "@/lib/dashboard/parent";
import { getTaskForContentUrl } from "@/lib/dashboard/plan";
import { getNotionChildPages, getNotionBlocks, fetchToggleChildren } from "@/lib/notion/fetcher";
import { NOTION_PAGE_IDS } from "@/lib/notion/config";
import { PLAN_PHASE_COLORS } from "@/lib/types/plan";
import { NotionRenderer } from "@/components/notion/NotionRenderer";
import { TaskStatusWidget } from "@/components/dashboard/TaskStatusWidget";
import { VideoEmbed } from "@/components/notion/VideoEmbed";

export default async function ParentConciergeModulePage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { from?: string };
}) {
  const context = await fetchParentStudentContext();

  if (!context.studentId) redirect("/dashboard/parent/content");
  if (!context.shareContent) redirect("/dashboard/parent/content");
  if (context.membershipRank < 3) redirect("/dashboard/parent/content");

  const studentId = context.studentId as string;

  const modules = await getNotionChildPages(NOTION_PAGE_IDS.concierge);
  const currentModule = modules.find((m) => m.slug === params.slug);
  if (!currentModule) return notFound();

  const contentPath = `/dashboard/content/concierge/${params.slug}`;

  const [blocks, matchingTask] = await Promise.all([
    getNotionBlocks(currentModule.id),
    getTaskForContentUrl(studentId, contentPath),
  ]);

  const toggleChildren = await fetchToggleChildren(blocks);

  const currentIndex = modules.findIndex((m) => m.slug === params.slug);
  const prevModule = modules[currentIndex - 1] ?? null;
  const nextModule = modules[currentIndex + 1] ?? null;

  return (
    <div>
      {searchParams.from === "plan" && (
        <Link
          href="/dashboard/parent/plan"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
        >
          ← Back to My Student&apos;s Plan
        </Link>
      )}

      <div className="mb-4 rounded-[var(--radius-sm)] border border-[var(--accent)]/20 bg-[var(--accent)]/5 px-4 py-2 text-sm text-[var(--accent)]">
        You&apos;re viewing {context.studentFirstName}&apos;s content
      </div>

      {matchingTask && (
        <TaskStatusWidget
          task={matchingTask}
          phaseColor={PLAN_PHASE_COLORS[matchingTask.phase]}
          readOnly={true}
        />
      )}

      <h1 className="font-primary font-bold text-2xl text-[var(--text)] mb-6">
        {currentModule.title}
      </h1>

      {matchingTask?.video_url && (
        <VideoEmbed url={matchingTask.video_url} title={currentModule.title} />
      )}

      <NotionRenderer blocks={blocks} toggleChildren={toggleChildren} />

      <div className="flex items-center justify-between mt-12 pt-6 border-t border-[var(--border)]">
        <div>
          {prevModule && (
            <Link
              href={`/dashboard/parent/content/concierge/${prevModule.slug}`}
              className="flex items-center gap-2 text-[var(--text-muted)] text-sm hover:text-[var(--text)]"
            >
              ← {prevModule.title}
            </Link>
          )}
        </div>
        <div>
          {nextModule && (
            <Link
              href={`/dashboard/parent/content/concierge/${nextModule.slug}`}
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
