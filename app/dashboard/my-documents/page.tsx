import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchUserDocuments } from "@/lib/dashboard/content";
import { ContentGrid } from "@/components/dashboard/ContentGrid";
import {
  fetchSubmissionFiles,
  fetchUserSubmissions,
} from "@/lib/actions/documents";
import { GeneralUploadLauncher } from "@/components/documents/GeneralUploadLauncher";
import { SubmissionCard } from "@/components/documents/SubmissionCard";
import type { DocumentSubmission } from "@/lib/types/documents";

// My Documents page — shows all PDFs individually assigned to this user.
// Unlike the tier pages, any authenticated user can reach this route.
type PageProps = {
  searchParams?: {
    upload?: string;
    taskId?: string;
    label?: string;
  };
};

export default async function MyDocumentsPage({ searchParams }: PageProps) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const { data: profileData } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const profile = profileData as { role: "student" | "parent" | null } | null;

  if (profile?.role === "parent") redirect("/dashboard/parent/plan");

  const [documents, submissions] = await Promise.all([
    fetchUserDocuments(user.id),
    fetchUserSubmissions(),
  ]);
  const submissionsWithUrls = await Promise.all(
    submissions.map(async (submission) => ({
      ...submission,
      files: await fetchSubmissionFiles(submission.id),
    }))
  );
  const groupedSubmissions = submissionsWithUrls.reduce<
    Record<string, DocumentSubmission[]>
  >((groups, submission) => {
    const key = submission.task_id ?? submission.section_label ?? "general";
    return {
      ...groups,
      [key]: [...(groups[key] ?? []), submission],
    };
  }, {});
  const uploadTaskId = searchParams?.taskId?.trim() || undefined;
  const uploadLabel = searchParams?.label?.trim() || undefined;

  return (
    <div className="space-y-12 bg-[var(--bg)]">
      <section>
        <h1 className="mb-1 font-primary text-3xl font-bold tracking-tight text-[var(--text)]">
          Assigned Documents
        </h1>
        <p className="mb-8 font-primary text-sm text-[var(--text-muted)]">
          Documents shared with you by the UStart team.
        </p>
        <ContentGrid items={documents} />
      </section>

      <section>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="mb-1 font-primary text-2xl font-bold tracking-tight text-[var(--text)]">
              My Submissions
            </h2>
            <p className="font-primary text-sm text-[var(--text-muted)]">
              Documents you&apos;ve submitted for review.
            </p>
          </div>
          <GeneralUploadLauncher
            initialOpen={searchParams?.upload === "true"}
            taskId={uploadTaskId}
            sectionLabel={uploadLabel}
          />
        </div>

        {submissionsWithUrls.length === 0 ? (
          <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-6">
            <p className="text-sm text-[var(--text-muted)]">
              You haven&apos;t submitted any documents yet. Documents submitted
              from your plan tasks will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedSubmissions).map(([key, group]) => {
              const sortedGroup = [...group].sort(
                (left, right) =>
                  new Date(right.created_at).getTime() -
                  new Date(left.created_at).getTime()
              );
              const [latestSubmission, ...previousSubmissions] = sortedGroup;
              if (!latestSubmission) return null;
              const label = latestSubmission.section_label ?? "General";

              return (
                <div key={key} className="mb-4">
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    {label}
                  </h4>

                  <SubmissionCard
                    submission={latestSubmission}
                    isLatest
                    showTitle={false}
                  />

                  {previousSubmissions.length > 0 && (
                    <details className="mt-2">
                      <summary className="flex cursor-pointer list-none items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text)]">
                        <svg
                          className="h-3 w-3"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="m9 18 6-6-6-6" />
                        </svg>
                        {previousSubmissions.length} previous submission
                        {previousSubmissions.length > 1 ? "s" : ""}
                      </summary>
                      <div className="mt-2 space-y-2 border-l-2 border-[var(--border)] pl-2">
                        {previousSubmissions.map((submission) => (
                          <SubmissionCard
                            key={submission.id}
                            submission={submission}
                            isLatest={false}
                            showTitle={false}
                          />
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
