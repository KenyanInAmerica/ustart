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
import { VideoEmbed } from "@/components/notion/VideoEmbed";
import { TaskUploadSection } from "@/components/documents/TaskUploadSection";

export default async function LiteModulePage({
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
    getNotionChildPages(NOTION_PAGE_IDS.lite),
  ]);

  if (access.role === "parent") redirect("/dashboard/parent/content");
  if (access.membershipRank < 1) redirect("/dashboard/content");

  const currentModule = modules.find((m) => m.slug === params.slug);
  if (!currentModule) return notFound();

  const contentPath = `/dashboard/content/lite/${params.slug}`;

  const [blocks, matchingTask] = await Promise.all([
    getNotionBlocks(currentModule.id),
    getTaskForContentUrl(user.id, contentPath),
  ]);

  const toggleChildren = await fetchToggleChildren(blocks);

  const currentIndex = modules.findIndex((m) => m.slug === params.slug);
  const prevModule = modules[currentIndex - 1] ?? null;
  const nextModule = modules[currentIndex + 1] ?? null;

  const { hasExplore, hasConcierge } = access;

  function LastModuleFooter() {
    if (hasConcierge) {
      return (
        <div className="bg-[var(--bg-subtle)] rounded-[var(--radius-md)] p-6 mt-8 text-center">
          <p className="font-semibold text-[var(--text)] mb-1">
            You&apos;ve completed UStart Lite 🎉
          </p>
          <p className="text-[var(--text-muted)] text-sm">
            Continue your journey with UStart Explore and Concierge.
          </p>
        </div>
      );
    }

    if (hasExplore) {
      return (
        <div className="bg-[var(--bg-subtle)] rounded-[var(--radius-md)] p-6 mt-8 text-center">
          <p className="font-semibold text-[var(--text)] mb-1">
            You&apos;ve completed UStart Lite 🎉
          </p>
          <p className="text-[var(--text-muted)] text-sm">
            Head to UStart Explore for your next steps.
          </p>
          <Link
            href="/dashboard/content/explore"
            className="inline-flex items-center gap-2 mt-3 px-5 py-2.5 bg-[var(--accent)] text-white font-semibold rounded-[var(--radius-sm)] hover:bg-[var(--accent-hover)] text-sm"
          >
            Go to Explore →
          </Link>
        </div>
      );
    }

    return (
      <div className="bg-[#4ECBA5]/5 border border-[#4ECBA5]/20 rounded-[var(--radius-md)] p-6 mt-8">
        <p className="font-semibold text-[var(--text)] text-lg mb-2">
          You&apos;ve completed UStart Lite 🎉
        </p>
        <p className="text-[var(--text-muted)] text-sm mb-4">
          Ready for deeper guidance? UStart Explore gives you ongoing support,
          city-specific resources, and school breakdowns beyond the setup stage.
        </p>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#4ECBA5] text-white font-semibold rounded-[var(--radius-sm)] hover:bg-[#3db891] transition-colors text-sm"
        >
          Upgrade to Explore →
        </Link>
      </div>
    );
  }

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

      {matchingTask?.video_url && (
        <VideoEmbed url={matchingTask.video_url} title={currentModule.title} />
      )}

      <NotionRenderer blocks={blocks} toggleChildren={toggleChildren} />

      {matchingTask?.accepts_upload && (
        <TaskUploadSection
          taskId={matchingTask.id}
          templateId={matchingTask.template_id ?? ""}
          sectionLabel={currentModule.title}
          userId={user.id}
        />
      )}

      <div className="flex items-center justify-between mt-12 pt-6 border-t border-[var(--border)]">
        <div>
          {prevModule && (
            <Link
              href={`/dashboard/content/lite/${prevModule.slug}`}
              className="flex items-center gap-2 text-[var(--text-muted)] text-sm hover:text-[var(--text)]"
            >
              ← {prevModule.title}
            </Link>
          )}
        </div>

        <div>
          {nextModule && (
            <Link
              href={`/dashboard/content/lite/${nextModule.slug}`}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-white rounded-[var(--radius-sm)] text-sm hover:bg-[var(--accent-hover)]"
            >
              {nextModule.title} →
            </Link>
          )}
        </div>
      </div>

      {!nextModule && <LastModuleFooter />}
    </div>
  );
}
