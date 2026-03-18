// Admin content library page.
// Section A — tier content library: upload, filter, delete PDFs.
// Section B — individual user assignments: search a user, assign/revoke PDFs per-user.

import { fetchContentItems } from "@/lib/admin/data";
import { ContentUploadForm } from "@/components/admin/ContentUploadForm";
import { ContentDeleteButton } from "./ContentDeleteButton";
import { UserPdfAssignment } from "./UserPdfAssignment";
import Link from "next/link";
import type { ContentItem } from "@/types/admin";

interface PageProps {
  searchParams: { tier?: string };
}

const TIER_OPTIONS: { value: ContentItem["tier"] | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "lite", label: "Lite" },
  { value: "pro", label: "Pro" },
  { value: "premium", label: "Premium" },
  { value: "parent_pack", label: "Parent Pack" },
  { value: "explore", label: "Explore" },
  { value: "concierge", label: "Concierge" },
];

export default async function AdminContentPage({ searchParams }: PageProps) {
  const tierFilter = (searchParams.tier as ContentItem["tier"] | undefined) ?? undefined;

  // allContent is unfiltered — needed for the assignment section regardless of tier filter.
  const [items, allContent] = await Promise.all([
    fetchContentItems(tierFilter),
    fetchContentItems(),
  ]);

  return (
    <div className="px-8 py-8 max-w-5xl">
      <h1 className="font-syne font-extrabold text-2xl tracking-[-0.02em] text-white mb-1">
        Content
      </h1>
      <p className="text-[13px] text-white/40 mb-8">
        Upload PDFs and manage the content library by category.
      </p>

      {/* ── Section A — Tier content library ─────────────────────────────────── */}

      {/* Upload form */}
      <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl px-6 py-5 mb-8">
        <h2 className="text-[13px] font-medium text-white mb-4">Upload new PDF</h2>
        <ContentUploadForm />
      </div>

      {/* Tier filter */}
      <div className="flex gap-1 mb-5">
        {TIER_OPTIONS.map((opt) => {
          const href = opt.value ? `/admin/content?tier=${opt.value}` : "/admin/content";
          const active = (tierFilter ?? "") === opt.value;
          return (
            <Link
              key={opt.value}
              href={href}
              className={`px-3 py-1.5 text-[13px] rounded-lg transition-colors ${
                active
                  ? "bg-white/[0.08] text-white"
                  : "text-white/40 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              {opt.label}
            </Link>
          );
        })}
      </div>

      {items.length === 0 ? (
        <p className="text-[13px] text-white/30 mb-12">No content items found.</p>
      ) : (
        <div className="border border-white/[0.07] rounded-xl overflow-hidden mb-12">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.07] bg-white/[0.02]">
                <th className="text-left px-4 py-3 text-[12px] text-white/40 font-medium">Title</th>
                <th className="text-left px-4 py-3 text-[12px] text-white/40 font-medium">Category</th>
                <th className="text-left px-4 py-3 text-[12px] text-white/40 font-medium">File</th>
                <th className="text-left px-4 py-3 text-[12px] text-white/40 font-medium">Uploaded</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr
                  key={item.id}
                  className={i < items.length - 1 ? "border-b border-white/[0.05]" : ""}
                >
                  <td className="px-4 py-3">
                    <p className="text-[13px] text-white/80">{item.title}</p>
                    <p className="text-[12px] text-white/40">{item.description}</p>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-white/60 capitalize">
                    {item.tier.replace("_", " ")}
                  </td>
                  <td className="px-4 py-3 text-[13px] text-white/50">{item.file_name}</td>
                  <td className="px-4 py-3 text-[13px] text-white/40">
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
      <div className="border-t border-white/[0.07] pt-10">
        <UserPdfAssignment allContent={allContent} />
      </div>
    </div>
  );
}
