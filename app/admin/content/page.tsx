// Admin content library page.
// Section A — tier content library: upload, filter, delete PDFs.
// Section B — individual user assignments: search a user, assign/revoke PDFs per-user.

import { fetchContentItems } from "@/lib/admin/data";
import { ContentUploadForm } from "@/components/admin/ContentUploadForm";
import { ContentDeleteButton } from "./ContentDeleteButton";
import { UserPdfAssignment } from "./UserPdfAssignment";
import Link from "next/link";
import { accentSurfaceClass, type ProductAccent } from "@/lib/config/productAccents";
import type { ContentItem } from "@/types/admin";

interface PageProps {
  searchParams: { tier?: string };
}

const TIER_OPTIONS: { value: ContentItem["tier"] | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "lite", label: "Lite" },
  { value: "explore", label: "Explore" },
  { value: "concierge", label: "Concierge" },
  { value: "parent_pack", label: "Parent Pack" },
];

export default async function AdminContentPage({ searchParams }: PageProps) {
  const tierFilter = (searchParams.tier as ContentItem["tier"] | undefined) ?? undefined;

  // allContent is unfiltered — needed for the assignment section regardless of tier filter.
  const [items, allContent] = await Promise.all([
    fetchContentItems(tierFilter),
    fetchContentItems(),
  ]);

  function tierAccent(tier: ContentItem["tier"]): ProductAccent {
    switch (tier) {
      case "explore":
        return "explore";
      case "concierge":
        return "concierge";
      case "parent_pack":
        return "parent_pack";
      default:
        return "lite";
    }
  }

  return (
    <div className="px-8 py-8 max-w-5xl">
      <h1 className="mb-1 font-primary text-2xl font-extrabold tracking-[-0.02em] text-[var(--text)]">
        Content
      </h1>
      <p className="mb-8 text-[13px] text-[var(--text-muted)]">
        Upload PDFs and manage the content library by category.
      </p>

      {/* ── Section A — Tier content library ─────────────────────────────────── */}

      {/* Upload form */}
      <div className="mb-8 rounded-[var(--radius-lg)] border border-[var(--border)] bg-white px-6 py-5">
        <h2 className="mb-4 text-[13px] font-medium text-[var(--text)]">Upload new PDF</h2>
        <ContentUploadForm />
      </div>

      {/* Tier filter */}
      <div className="mb-5 flex gap-1">
        {TIER_OPTIONS.map((opt) => {
          const href = opt.value ? `/admin/content?tier=${opt.value}` : "/admin/content";
          const active = (tierFilter ?? "") === opt.value;
          return (
            <Link
              key={opt.value}
              href={href}
              className={`rounded-[var(--radius-sm)] px-3 py-1.5 text-[13px] transition-colors ${
                active
                  ? "bg-[#3083DC]/10 text-[#3083DC]"
                  : "text-[var(--text-mid)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text)]"
              }`}
            >
              {opt.label}
            </Link>
          );
        })}
      </div>

      {items.length === 0 ? (
        <p className="mb-12 text-[13px] text-[var(--text-muted)]">No content items found.</p>
      ) : (
        <div className="mb-12 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-white">
          <table className="w-full">
            <thead>
              <tr className="bg-[var(--bg-subtle)] text-[var(--text-muted)]">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Title</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">File</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Uploaded</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr
                  key={item.id}
                  className={`${i < items.length - 1 ? "border-b border-[var(--border)]" : ""} transition-colors hover:bg-[var(--bg-subtle)]`}
                >
                  <td className="px-4 py-3">
                    <p className="text-[13px] text-[var(--text)]">{item.title}</p>
                    <p className="text-[12px] text-[var(--text-muted)]">{item.description}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${accentSurfaceClass(tierAccent(item.tier))}`}>
                      {item.tier.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-[var(--text-mid)]">{item.file_name}</td>
                  <td className="px-4 py-3 text-[13px] text-[var(--text-muted)]">
                    {new Date(item.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ContentDeleteButton contentItemId={item.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Section B — Individual user assignments ───────────────────────────── */}
      <div className="border-t border-[var(--border)] pt-10">
        <UserPdfAssignment allContent={allContent} />
      </div>
    </div>
  );
}
