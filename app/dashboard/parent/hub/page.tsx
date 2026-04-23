import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { Card } from "@/components/ui/Card";
import { fetchParentPackLinks } from "@/lib/dashboard/parentPack";

function hasLiveParentHubUrl(url: string): boolean {
  const trimmed = url.trim();
  return trimmed.length > 0 && !trimmed.includes("placeholder");
}

export default async function ParentHubPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const service = createServiceClient();
  const { data: parentProfileData } = await service
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const parentProfile = parentProfileData as { role: "student" | "parent" | null } | null;

  if (parentProfile?.role !== "parent") redirect("/dashboard");

  const links = await fetchParentPackLinks();
  const hasLiveUrl = hasLiveParentHubUrl(links.parentContentNotionUrl);

  return (
    <div className="bg-[var(--bg)]">
      <h1 className="font-primary text-2xl font-bold text-[var(--text)]">
        Parent Hub
      </h1>
      <p className="mt-1 mb-8 font-primary text-sm text-[var(--text-muted)]">
        Exclusive resources for parents of UStart students.
      </p>

      <Card className="border border-[var(--border)]" padding="md">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
            <path d="M12 3v18" />
            <path d="M7 7.5h8a3.5 3.5 0 1 1 0 7H9.5a3.5 3.5 0 1 0 0 7H17" />
          </svg>
        </div>
        <h2 className="mb-2 text-lg font-semibold text-[var(--text)]">
          Parent-Exclusive Content
        </h2>
        <p className="mb-6 text-sm text-[var(--text-muted)]">
          Access guides, resources, and insights created exclusively for parents supporting their student&apos;s US journey — from financial tips to cultural guidance.
        </p>

        {hasLiveUrl ? (
          <a
            href={links.parentContentNotionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center rounded-[var(--radius-sm)] bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-hover)] sm:w-auto"
          >
            Open Parent Resources →
          </a>
        ) : (
          <div className="rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] p-4 text-center">
            <p className="text-sm text-[var(--text-muted)]">
              Parent resources are coming soon. Check back shortly.
            </p>
          </div>
        )}
      </Card>

      <div className="mt-4 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] p-4">
        <h3 className="mb-2 text-sm font-semibold text-[var(--text)]">What&apos;s included</h3>
        <ul className="space-y-2 text-sm text-[var(--text-muted)]">
          <li>Understanding the US education system</li>
          <li>Financial guidance for supporting your student</li>
          <li>Safety and communication tips</li>
          <li>Cultural adjustment resources</li>
          <li>How to use UStart alongside your student</li>
        </ul>
      </div>
    </div>
  );
}
