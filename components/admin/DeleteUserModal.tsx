"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import type { AdminUser } from "@/types/admin";
import { hardDeleteUser, softDeleteUser } from "@/lib/actions/admin/users";

interface DeleteUserModalProps {
  user: AdminUser;
  onClose: () => void;
  onDeleted: () => void;
}

export function DeleteUserModal({ user, onClose, onDeleted }: DeleteUserModalProps) {
  const alreadyInactive = !user.is_active;
  const [softAck, setSoftAck] = useState(false);
  const [showHard, setShowHard] = useState(alreadyInactive);
  const [hardAck, setHardAck] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [softPending, startSoft] = useTransition();
  const [hardPending, startHard] = useTransition();

  const displayName = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email;

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
      <div
        className="fixed inset-0 z-[300] bg-navy/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Delete user confirmation"
        className="fixed inset-0 z-[301] flex items-center justify-center px-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full max-w-[480px] overflow-hidden rounded-[var(--radius-lg)] bg-white shadow-[var(--shadow-lg)]">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-5">
            <div className="flex items-center gap-3">
              <svg className="h-5 w-5 text-[#E54B4B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
              </svg>
              <h2 className="font-primary text-base font-bold text-[var(--text)]">Delete User</h2>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-5 px-6 py-5">
            <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-subtle)] px-4 py-3">
              <p className="text-[13.5px] font-medium text-[var(--text)]">{displayName}</p>
              <p className="mt-0.5 text-[12px] text-[var(--text-muted)]">{user.email}</p>
            </div>

            {alreadyInactive && (
              <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-subtle)] px-4 py-3 text-[13px] leading-relaxed text-[var(--text-mid)]">
                This account is already deactivated. You can permanently erase all data below.
              </div>
            )}

            {!alreadyInactive && (
              <div className="space-y-3">
                <label className="group flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={softAck}
                    onChange={(e) => setSoftAck(e.target.checked)}
                    className="mt-0.5 shrink-0 cursor-pointer accent-[var(--accent)]"
                  />
                  <span className="text-[13px] leading-relaxed text-[var(--text-mid)] transition-colors group-hover:text-[var(--text)]">
                    I acknowledge that this action will deactivate the account for{" "}
                    <span className="font-medium text-[var(--text)]">{displayName}</span> ({user.email}).
                  </span>
                </label>

                {error && <p className="text-[13px] text-[var(--destructive)]" role="alert">{error}</p>}

                <Button
                  onClick={handleSoftDelete}
                  disabled={!softAck || softPending || hardPending}
                  variant="secondary"
                  className="w-full"
                >
                  {softPending ? "Deactivating…" : "Deactivate Account"}
                </Button>
              </div>
            )}

            <div className={alreadyInactive ? "" : "border-t border-[var(--border)] pt-4"}>
              {!showHard ? (
                <button
                  onClick={() => setShowHard(true)}
                  className="text-[12px] text-[var(--text-muted)] underline underline-offset-2 transition-colors hover:text-[var(--text)]"
                >
                  Permanent erasure
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-[12px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
                    Permanent erasure
                  </p>

                  <label className="group flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={hardAck}
                      onChange={(e) => setHardAck(e.target.checked)}
                      className="mt-0.5 shrink-0 cursor-pointer accent-[#E54B4B]"
                    />
                    <span className="text-[13px] leading-relaxed text-[var(--text-mid)] transition-colors group-hover:text-[var(--text)]">
                      I acknowledge that this will permanently and irreversibly delete all data for this user, including their profile, memberships, purchases, and add-ons.
                    </span>
                  </label>

                  {error && alreadyInactive && (
                    <p className="text-[13px] text-[var(--destructive)]" role="alert">{error}</p>
                  )}

                  <div className="flex gap-3">
                    <Button
                      onClick={handleHardDelete}
                      disabled={(!alreadyInactive && !softAck) || !hardAck || softPending || hardPending}
                      variant="destructive"
                      className="flex-1"
                    >
                      {hardPending ? "Deleting permanently…" : "Delete Permanently"}
                    </Button>
                    <Button onClick={onClose} variant="ghost">
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
