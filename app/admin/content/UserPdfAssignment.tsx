"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { accentSurfaceClass, type ProductAccent } from "@/lib/config/productAccents";
import type { ContentItem, UserContentItem } from "@/types/admin";
import {
  searchUsersForAssignment,
  getUserAssignments,
  assignContentToUser,
  revokeContentFromUser,
} from "@/lib/actions/admin/users";
import { uploadAndAssignContentItem } from "@/lib/actions/admin/content";

type UserResult = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  membership_tier: string | null;
};

interface UserPdfAssignmentProps {
  allContent: ContentItem[];
}

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

export function UserPdfAssignment({ allContent }: UserPdfAssignmentProps) {
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [isSearching, startSearchTransition] = useTransition();

  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [assignments, setAssignments] = useState<UserContentItem[]>([]);
  const [isLoadingAssignments, startAssignmentsTransition] = useTransition();

  const [revokeError, setRevokeError] = useState<string | null>(null);
  const [revokeSuccess, setRevokeSuccess] = useState<string | null>(null);
  const [isRevoking, startRevokeTransition] = useTransition();

  const [assignError, setAssignError] = useState<string | null>(null);
  const [assignSuccess, setAssignSuccess] = useState<string | null>(null);
  const [isAssigning, startAssignTransition] = useTransition();

  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [isUploading, startUploadTransition] = useTransition();
  const [uploadFileName, setUploadFileName] = useState<string | null>(null);

  function flash(setter: (v: string | null) => void, message: string) {
    setter(message);
    setTimeout(() => setter(null), 3000);
  }

  function clearAllFeedback() {
    setRevokeError(null);
    setRevokeSuccess(null);
    setAssignError(null);
    setAssignSuccess(null);
    setUploadError(null);
    setUploadSuccess(null);
  }

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const term = searchInput.trim();
    if (!term) return;
    startSearchTransition(async () => {
      const results = await searchUsersForAssignment(term);
      setSearchResults(results);
    });
  }

  function selectUser(user: UserResult) {
    setSelectedUser(user);
    setSearchResults([]);
    setSearchInput("");
    clearAllFeedback();
    startAssignmentsTransition(async () => {
      const data = await getUserAssignments(user.id);
      setAssignments(data);
    });
  }

  function clearUser() {
    setSelectedUser(null);
    setAssignments([]);
    clearAllFeedback();
  }

  function handleRevoke(assignmentId: string) {
    if (!selectedUser) return;
    setRevokeError(null);
    setRevokeSuccess(null);
    startRevokeTransition(async () => {
      const result = await revokeContentFromUser(assignmentId);
      if (!result.success) {
        flash(setRevokeError, result.error);
      } else {
        flash(setRevokeSuccess, "PDF revoked successfully.");
        const data = await getUserAssignments(selectedUser.id);
        setAssignments(data);
      }
    });
  }

  function handleAssign(contentItemId: string) {
    if (!selectedUser) return;
    setAssignError(null);
    setAssignSuccess(null);
    startAssignTransition(async () => {
      const result = await assignContentToUser(selectedUser.id, contentItemId);
      if (!result.success) {
        flash(setAssignError, result.error);
      } else {
        flash(setAssignSuccess, "PDF assigned successfully.");
        const data = await getUserAssignments(selectedUser.id);
        setAssignments(data);
      }
    });
  }

  function handleUploadAssign(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedUser) return;
    const form = e.currentTarget;
    const formData = new FormData(form);
    setUploadError(null);
    setUploadSuccess(null);
    startUploadTransition(async () => {
      const result = await uploadAndAssignContentItem(formData, selectedUser.id);
      if (!result.success) {
        flash(setUploadError, result.error);
      } else {
        flash(setUploadSuccess, "PDF uploaded and assigned.");
        form.reset();
        setUploadFileName(null);
        const data = await getUserAssignments(selectedUser.id);
        setAssignments(data);
      }
    });
  }

  const assignedIds = new Set(assignments.map((a) => a.content_item_id));
  const availableContent = allContent.filter((c) => !assignedIds.has(c.id));

  return (
    <section>
      <h2 className="mb-1 font-primary text-xl font-extrabold tracking-[-0.02em] text-[var(--text)]">
        Individual user assignments
      </h2>
      <p className="mb-6 text-[13px] text-[var(--text-muted)]">
        Assign PDFs directly to a specific user to supplement their tier access.
      </p>

      <div className="mb-5 rounded-[var(--radius-lg)] border border-[var(--border)] bg-white px-6 py-5">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
          Find user
        </h3>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name or email…"
            className="flex-1 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-2 text-[13px] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none"
          />
          <Button
            type="submit"
            disabled={isSearching || !searchInput.trim()}
            variant="secondary"
            size="sm"
          >
            {isSearching ? "Searching…" : "Search"}
          </Button>
        </form>

        {searchResults.length > 0 && !selectedUser && (
          <ul className="mt-3 space-y-0.5 overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)]">
            {searchResults.map((u) => (
              <li key={u.id}>
                <button
                  onClick={() => selectUser(u)}
                  className="w-full px-4 py-2.5 text-left transition-colors hover:bg-[var(--bg-subtle)]"
                >
                  <p className="text-[13px] text-[var(--text)]">{u.email}</p>
                  {(u.first_name || u.last_name) && (
                    <p className="mt-0.5 text-[12px] text-[var(--text-muted)]">
                      {[u.first_name, u.last_name].filter(Boolean).join(" ")}
                    </p>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}

        {selectedUser && (
          <div className="mt-3 flex items-center justify-between border-t border-[var(--border)] pt-3">
            <div>
              <p className="text-[13px] text-[var(--text)]">{selectedUser.email}</p>
              <p className="mt-0.5 text-[12px] text-[var(--text-muted)]">
                {selectedUser.membership_tier
                  ? `Plan: ${selectedUser.membership_tier.charAt(0).toUpperCase() + selectedUser.membership_tier.slice(1)}`
                  : "No plan"}
              </p>
            </div>
            <Button onClick={clearUser} variant="ghost" size="sm">
              Clear
            </Button>
          </div>
        )}
      </div>

      {selectedUser && (
        <div className="space-y-4">
          <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-white px-6 py-5">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
              Individually assigned
            </h3>
            {isLoadingAssignments ? (
              <p className="text-[13px] text-[var(--text-muted)]">Loading…</p>
            ) : assignments.length === 0 ? (
              <p className="text-[13px] text-[var(--text-muted)]">No individual PDFs assigned.</p>
            ) : (
              <ul className="space-y-1.5">
                {assignments.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-2"
                  >
                    <div>
                      <p className="text-[13px] leading-snug text-[var(--text)]">
                        {a.content_item?.title ?? a.content_item_id}
                      </p>
                      {a.content_item?.tier && (
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${accentSurfaceClass(tierAccent(a.content_item.tier))}`}>
                          {a.content_item.tier.replace("_", " ")}
                        </span>
                      )}
                    </div>
                    <Button onClick={() => handleRevoke(a.id)} disabled={isRevoking} variant="destructive" size="sm">
                      Revoke
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            {revokeError && <p className="mt-3 text-[12px] text-[var(--destructive)]">{revokeError}</p>}
            {revokeSuccess && <p className="mt-3 text-[12px] text-emerald-600">{revokeSuccess}</p>}
          </div>

          <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-white px-6 py-5">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
              Available PDFs
            </h3>
            {availableContent.length === 0 ? (
              <p className="text-[13px] text-[var(--text-muted)]">All PDFs are already assigned.</p>
            ) : (
              <ul className="space-y-1.5">
                {availableContent.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-2"
                  >
                    <div>
                      <p className="text-[13px] leading-snug text-[var(--text)]">{c.title}</p>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${accentSurfaceClass(tierAccent(c.tier))}`}>
                        {c.tier.replace("_", " ")}
                      </span>
                    </div>
                    <Button onClick={() => handleAssign(c.id)} disabled={isAssigning} size="sm">
                      Assign
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            {assignError && <p className="mt-3 text-[12px] text-[var(--destructive)]">{assignError}</p>}
            {assignSuccess && <p className="mt-3 text-[12px] text-emerald-600">{assignSuccess}</p>}
          </div>

          <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-white px-6 py-5">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
              Upload &amp; assign new PDF
            </h3>
            <form onSubmit={handleUploadAssign} className="space-y-3">
              <input
                name="title"
                placeholder="Title"
                required
                className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-2 text-[13px] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none"
              />
              <div>
                <label className="flex cursor-pointer items-center gap-3">
                  <span className="shrink-0 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-2 text-[13px] text-[var(--text-mid)] transition-colors hover:bg-white">
                    Choose PDF
                  </span>
                  <span className="truncate text-[13px] text-[var(--text-muted)]">
                    {uploadFileName ?? "No file chosen"}
                  </span>
                  <input
                    name="file"
                    type="file"
                    accept="application/pdf"
                    required
                    className="sr-only"
                    onChange={(e) => setUploadFileName(e.target.files?.[0]?.name ?? null)}
                  />
                </label>
              </div>
              <Button type="submit" disabled={isUploading} size="sm">
                {isUploading ? "Uploading…" : "Upload & Assign"}
              </Button>
            </form>
            {uploadError && <p className="mt-3 text-[12px] text-[var(--destructive)]">{uploadError}</p>}
            {uploadSuccess && <p className="mt-3 text-[12px] text-emerald-600">{uploadSuccess}</p>}
          </div>
        </div>
      )}
    </section>
  );
}
