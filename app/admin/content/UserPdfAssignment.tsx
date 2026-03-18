// Client component for individual user PDF assignment in the Content section.
// Admins search for a user, then see that user's existing assignments and the
// full content library. Each assign/revoke fires immediately and the list
// re-fetches so the UI reflects the current state without a page reload.

"use client";

import { useState, useTransition } from "react";
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

export function UserPdfAssignment({ allContent }: UserPdfAssignmentProps) {
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [isSearching, startSearchTransition] = useTransition();

  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [assignments, setAssignments] = useState<UserContentItem[]>([]);
  const [isLoadingAssignments, startAssignmentsTransition] = useTransition();

  // Each section owns its own feedback so messages appear inline, not at the top.
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

  // Sets a message then clears it after 3 s so it doesn't linger when the
  // admin navigates to another part of the page.
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
        // Re-fetch so the assigned/available lists stay in sync.
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

  // Exclude already-assigned content from the available list.
  const assignedIds = new Set(assignments.map((a) => a.content_item_id));
  const availableContent = allContent.filter((c) => !assignedIds.has(c.id));

  return (
    <section>
      <h2 className="font-syne font-extrabold text-xl tracking-[-0.02em] text-white mb-1">
        Individual user assignments
      </h2>
      <p className="text-[13px] text-white/40 mb-6">
        Assign PDFs directly to a specific user to supplement their tier access.
      </p>

      {/* User search */}
      <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl px-6 py-5 mb-5">
        <h3 className="text-[12px] font-medium tracking-[0.06em] uppercase text-white/40 mb-3">
          Find user
        </h3>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name or email…"
            className="flex-1 bg-white/[0.05] border border-white/[0.10] rounded-lg px-3 py-2 text-[13px] text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
          />
          <button
            type="submit"
            disabled={isSearching || !searchInput.trim()}
            className="px-4 py-2 bg-white/[0.08] text-white text-[13px] rounded-lg hover:bg-white/[0.12] transition-colors disabled:opacity-50 shrink-0"
          >
            {isSearching ? "Searching…" : "Search"}
          </button>
        </form>

        {/* Search results — shown only before a user is selected */}
        {searchResults.length > 0 && !selectedUser && (
          <ul className="mt-3 space-y-0.5 border border-white/[0.07] rounded-lg overflow-hidden">
            {searchResults.map((u) => (
              <li key={u.id}>
                <button
                  onClick={() => selectUser(u)}
                  className="w-full text-left px-4 py-2.5 hover:bg-white/[0.04] transition-colors"
                >
                  <p className="text-[13px] text-white/80">{u.email}</p>
                  {(u.first_name || u.last_name) && (
                    <p className="text-[12px] text-white/40 mt-0.5">
                      {[u.first_name, u.last_name].filter(Boolean).join(" ")}
                    </p>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Selected user badge */}
        {selectedUser && (
          <div className="mt-3 flex items-center justify-between border-t border-white/[0.07] pt-3">
            <div>
              <p className="text-[13px] text-white">{selectedUser.email}</p>
              <p className="text-[12px] text-white/40 mt-0.5">
                {selectedUser.membership_tier
                  ? `Plan: ${selectedUser.membership_tier.charAt(0).toUpperCase() + selectedUser.membership_tier.slice(1)}`
                  : "No plan"}
              </p>
            </div>
            <button
              onClick={clearUser}
              className="text-[12px] text-white/40 hover:text-white transition-colors"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Assignment management — only visible once a user is selected */}
      {selectedUser && (
        <div className="space-y-4">
          {/* Currently individually assigned */}
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl px-6 py-5">
            <h3 className="text-[12px] font-medium tracking-[0.06em] uppercase text-white/40 mb-3">
              Individually assigned
            </h3>
            {isLoadingAssignments ? (
              <p className="text-[13px] text-white/30">Loading…</p>
            ) : assignments.length === 0 ? (
              <p className="text-[13px] text-white/30">No individual PDFs assigned.</p>
            ) : (
              <ul className="space-y-1.5">
                {assignments.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-3 px-3 py-2 bg-white/[0.03] border border-white/[0.07] rounded-lg"
                  >
                    <div>
                      <p className="text-[13px] text-white/80 leading-snug">
                        {a.content_item?.title ?? a.content_item_id}
                      </p>
                      {a.content_item?.tier && (
                        <span className="text-[11px] text-white/40 capitalize">
                          {a.content_item.tier.replace("_", " ")}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleRevoke(a.id)}
                      disabled={isRevoking}
                      className="text-[12px] text-white/30 hover:text-red-400 transition-colors shrink-0 disabled:opacity-50"
                    >
                      Revoke
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {/* Revoke feedback — inline below the list */}
            {revokeError && <p className="text-red-400 text-[12px] mt-3">{revokeError}</p>}
            {revokeSuccess && <p className="text-emerald-400 text-[12px] mt-3">{revokeSuccess}</p>}
          </div>

          {/* Available to assign */}
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl px-6 py-5">
            <h3 className="text-[12px] font-medium tracking-[0.06em] uppercase text-white/40 mb-3">
              Available PDFs
            </h3>
            {availableContent.length === 0 ? (
              <p className="text-[13px] text-white/30">All PDFs are already assigned.</p>
            ) : (
              <ul className="space-y-1.5">
                {availableContent.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between gap-3 px-3 py-2 bg-white/[0.03] border border-white/[0.07] rounded-lg"
                  >
                    <div>
                      <p className="text-[13px] text-white/80 leading-snug">{c.title}</p>
                      <span className="text-[11px] text-white/40 capitalize">
                        {c.tier.replace("_", " ")}
                      </span>
                    </div>
                    <button
                      onClick={() => handleAssign(c.id)}
                      disabled={isAssigning}
                      className="text-[12px] text-white/50 hover:text-emerald-400 transition-colors shrink-0 disabled:opacity-50"
                    >
                      Assign
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {/* Assign feedback — inline below the list */}
            {assignError && <p className="text-red-400 text-[12px] mt-3">{assignError}</p>}
            {assignSuccess && <p className="text-emerald-400 text-[12px] mt-3">{assignSuccess}</p>}
          </div>

          {/* Upload a new PDF and assign it directly to this user */}
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl px-6 py-5">
            <h3 className="text-[12px] font-medium tracking-[0.06em] uppercase text-white/40 mb-3">
              Upload &amp; assign new PDF
            </h3>
            {/* No tier selector — individual uploads are never served in tier feeds.
                The action sets is_individual_only = true so the file is invisible
                to all users except the one it's assigned to. */}
            <form onSubmit={handleUploadAssign} className="space-y-3">
              <input
                name="title"
                placeholder="Title"
                required
                className="w-full bg-white/[0.05] border border-white/[0.10] rounded-lg px-3 py-2 text-[13px] text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
              />
              {/* File picker — show chosen file name so the admin knows what's queued */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <span className="px-3 py-2 bg-white/[0.08] text-white/70 text-[13px] rounded-lg hover:bg-white/[0.12] transition-colors shrink-0">
                    Choose PDF
                  </span>
                  <span className="text-[13px] text-white/40 truncate">
                    {uploadFileName ?? "No file chosen"}
                  </span>
                  <input
                    name="file"
                    type="file"
                    accept="application/pdf"
                    required
                    className="sr-only"
                    onChange={(e) =>
                      setUploadFileName(e.target.files?.[0]?.name ?? null)
                    }
                  />
                </label>
              </div>
              <button
                type="submit"
                disabled={isUploading}
                className="px-4 py-2 bg-white/[0.08] text-white text-[13px] rounded-lg hover:bg-white/[0.12] transition-colors disabled:opacity-50"
              >
                {isUploading ? "Uploading…" : "Upload & Assign"}
              </button>
            </form>
            {/* Upload feedback — inline below the form */}
            {uploadError && <p className="text-red-400 text-[12px] mt-3">{uploadError}</p>}
            {uploadSuccess && <p className="text-emerald-400 text-[12px] mt-3">{uploadSuccess}</p>}
          </div>
        </div>
      )}
    </section>
  );
}
