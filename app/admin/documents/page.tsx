import Link from "next/link";
import {
  fetchAdminDocumentSubmissions,
} from "@/lib/admin/data";
import { getSubmissionDownloadUrl } from "@/lib/actions/documents";
import { DocumentSubmissionsQueue } from "@/components/admin/DocumentSubmissionsQueue";
import type { DocumentSubmissionStatus } from "@/lib/types/documents";

type Filter = "all" | DocumentSubmissionStatus;

const FILTERS: { label: string; value: Filter }[] = [
  { label: "All", value: "all" },
  { label: "Pending Review", value: "pending_review" },
  { label: "Approved", value: "approved" },
  { label: "Resubmit Requested", value: "resubmit_requested" },
  { label: "Cancelled", value: "cancelled" },
];

interface PageProps {
  searchParams: { status?: string };
}

export default async function AdminDocumentsPage({ searchParams }: PageProps) {
  const activeFilter = FILTERS.some((filter) => filter.value === searchParams.status)
    ? (searchParams.status as Filter)
    : "all";

  const submissions = await fetchAdminDocumentSubmissions();
  const submissionsWithUrls = await Promise.all(
    submissions.map(async (submission) => ({
      ...submission,
      files: await Promise.all(
        submission.files.map(async (file) => ({
          ...file,
          signedUrl: await getSubmissionDownloadUrl(file.file_path),
        }))
      ),
    }))
  );
  return (
    <div className="max-w-6xl px-8 py-8">
      <h1 className="mb-1 font-primary text-2xl font-extrabold tracking-[-0.02em] text-[var(--text)]">
        Document Submissions
      </h1>
      <p className="mb-6 text-[13px] text-[var(--text-muted)]">
        Review documents submitted by students.
      </p>

      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((filter) => {
          const isActive = filter.value === activeFilter;
          const href =
            filter.value === "all"
              ? "/admin/documents"
              : `/admin/documents?status=${filter.value}`;
          return (
            <Link
              key={filter.value}
              href={href}
              className={`rounded-[var(--radius-sm)] border px-3 py-2 text-sm font-semibold transition-colors ${
                isActive
                  ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                  : "border-[var(--border)] bg-white text-[var(--text-mid)] hover:text-[var(--text)]"
              }`}
            >
              {filter.label}
            </Link>
          );
        })}
      </div>

      <DocumentSubmissionsQueue
        submissions={submissionsWithUrls}
        activeFilter={activeFilter}
      />
    </div>
  );
}
