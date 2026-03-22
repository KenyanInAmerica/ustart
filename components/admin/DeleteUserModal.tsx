"use client";

// Two-step confirmation modal for user deletion.
//
// Default path (active user):
//   Step 1 — Soft delete:
//     • Acknowledgement checkbox + "Deactivate Account" button
//   Step 2 — Hard delete (expanded via secondary link):
//     • Second checkbox + red "Delete Permanently" button
//     • Requires both checkboxes independently ticked
//
// Fast path (already-inactive user):
//   • Notice that the account is already deactivated
//   • Soft delete section skipped — hard delete section shown immediately

import { useState, useEffect, useTransition } from "react";
import type { AdminUser } from "@/types/admin";
import { softDeleteUser, hardDeleteUser } from "@/lib/actions/admin/users";

interface DeleteUserModalProps {
  user: AdminUser;
  onClose: () => void;
  onDeleted: () => void;
}

export function DeleteUserModal({ user, onClose, onDeleted }: DeleteUserModalProps) {
  const alreadyInactive = !user.is_active;

  const [softAck, setSoftAck] = useState(false);
  // Hard delete section starts expanded when the account is already inactive —
  // there's no soft delete step to show first.
  const [showHard, setShowHard] = useState(alreadyInactive);
  const [hardAck, setHardAck] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [softPending, startSoft] = useTransition();
  const [hardPending, startHard] = useTransition();

  const displayName =
    [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email;

  // Close on Escape.
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  function handleSoftDelete() {
    setError(null);
    startSoft(async () => {
      const result = await softDeleteUser(user.id);
      if (result.success) {
        onDeleted();
      } else {
        setError(result.error);
      }
    });
  }

  function handleHardDelete() {
    setError(null);
    startHard(async () => {
      const result = await hardDeleteUser(user.id);
      if (result.success) {
        onDeleted();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Delete user confirmation"
        className="fixed inset-0 z-[301] flex items-center justify-center px-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full max-w-[480px] bg-[#0C1220] border border-white/[0.10] rounded-2xl shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.07]">
            <h2 className="font-syne font-bold text-base text-white">
              Delete User
            </h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="text-white/40 hover:text-white transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-5">
            {/* User summary */}
            <div className="rounded-lg bg-white/[0.04] border border-white/[0.07] px-4 py-3">
              <p className="text-[13.5px] font-medium text-white">{displayName}</p>
              <p className="text-[12px] text-white/45 mt-0.5">{user.email}</p>
            </div>

            {/* Already-inactive notice — replaces the soft delete section */}
            {alreadyInactive && (
              <div className="rounded-lg bg-white/[0.04] border border-white/[0.08] px-4 py-3 text-[13px] text-white/50 leading-relaxed">
                This account is already deactivated. You can permanently erase all data below.
              </div>
            )}

            {/* ── Soft delete section — hidden for already-inactive users ── */}
            {!alreadyInactive && (
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={softAck}
                    onChange={(e) => setSoftAck(e.target.checked)}
                    className="mt-0.5 shrink-0 accent-white cursor-pointer"
                  />
                  <span className="text-[13px] text-white/60 leading-relaxed group-hover:text-white/80 transition-colors">
                    I acknowledge that this action will deactivate the account for{" "}
                    <span className="text-white/90 font-medium">
                      {user.first_name} {user.last_name}
                    </span>{" "}
                    ({user.email}). This cannot be undone without manual database intervention.
                  </span>
                </label>

                {error && (
                  <p className="text-[13px] text-red-400" role="alert">
                    {error}
                  </p>
                )}

                <button
                  onClick={handleSoftDelete}
                  disabled={!softAck || softPending || hardPending}
                  className="w-full bg-white text-[#05080F] font-medium text-[14px] py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {softPending ? "Deactivating…" : "Deactivate Account"}
                </button>
              </div>
            )}

            {/* ── Hard delete section ── */}
            {/* For active users: collapsed behind a link; for inactive users: shown immediately */}
            <div className={alreadyInactive ? "" : "border-t border-white/[0.07] pt-4"}>
              {!showHard ? (
                <button
                  onClick={() => setShowHard(true)}
                  className="text-[12px] text-white/30 hover:text-white/60 transition-colors underline underline-offset-2"
                >
                  Permanent erasure
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-[12px] text-white/50 font-medium uppercase tracking-wide">
                    Permanent erasure
                  </p>

                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={hardAck}
                      onChange={(e) => setHardAck(e.target.checked)}
                      className="mt-0.5 shrink-0 accent-red-500 cursor-pointer"
                    />
                    <span className="text-[13px] text-white/55 leading-relaxed group-hover:text-white/75 transition-colors">
                      I acknowledge that this will permanently and irreversibly delete all data for
                      this user, including their profile, memberships, purchases, and add-ons.
                      This is for formal erasure requests only and cannot be undone.
                    </span>
                  </label>

                  {/* Error shown here too for the hard-delete-only path */}
                  {error && alreadyInactive && (
                    <p className="text-[13px] text-red-400" role="alert">
                      {error}
                    </p>
                  )}

                  <button
                    onClick={handleHardDelete}
                    // For active users both checkboxes must be ticked.
                    // For already-inactive users the soft-ack is bypassed.
                    disabled={(!alreadyInactive && !softAck) || !hardAck || softPending || hardPending}
                    className="w-full bg-red-600 text-white font-medium text-[14px] py-2.5 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {hardPending ? "Deleting permanently…" : "Delete Permanently"}
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
