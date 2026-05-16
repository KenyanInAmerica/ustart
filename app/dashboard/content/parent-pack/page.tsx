import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchDashboardAccess } from "@/lib/dashboard/access";
import { fetchParentPackLinks } from "@/lib/dashboard/parentPack";
import { getNotionBlocks } from "@/lib/notion/fetcher";
import { NOTION_PAGE_IDS } from "@/lib/notion/config";
import { ParentPackManager } from "@/components/dashboard/ParentPackManager";
import { NotionPageShell } from "@/components/notion/NotionPageShell";

export default async function ParentPackPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const notionPageId = NOTION_PAGE_IDS.parentPack;

  const [access, links, blocks] = await Promise.all([
    fetchDashboardAccess(),
    fetchParentPackLinks(),
    notionPageId ? getNotionBlocks(notionPageId) : Promise.resolve([]),
  ]);

  if (access.role === "parent") redirect("/dashboard/parent/hub");
  if (!access.hasParentSeat) redirect("/dashboard");

  return (
    <div className="bg-[var(--bg)]">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="mb-1 font-primary text-3xl font-bold tracking-tight text-[var(--text)]">
            Parent Pack
          </h1>
          <p className="font-primary text-sm text-[var(--text-muted)]">
            Manage how a parent supports your UStart journey.
          </p>
        </div>
        {notionPageId && (
          <a
            href="#parent-settings"
            className="shrink-0 inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-hover)]"
          >
            Configure Parent Settings ↓
          </a>
        )}
      </div>

      {notionPageId ? (
        <NotionPageShell
          title="Parent Pack Resources"
          blocks={blocks}
        />
      ) : null}

      <section id="parent-settings" className={notionPageId ? "mt-8" : ""}>
        <ParentPackManager
          initialStatus={access.parentInvitationStatus}
          initialParentEmail={access.invitedParentEmail}
          initialPreferences={{
            share_tasks: access.parentShareTasks,
            share_calendar: access.parentShareCalendar,
            share_content: access.parentShareContent,
          }}
          parentPackNotionUrl={notionPageId ? "" : links.parentPackNotionUrl}
        />
      </section>
    </div>
  );
}
