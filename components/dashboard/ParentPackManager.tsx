"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  cancelParentInvitation,
  resendParentInvitation,
  sendParentInvitation,
  unlinkParent,
  updateParentSharing,
} from "@/lib/actions/parentInvitation";

interface SharingPreferences {
  share_tasks: boolean;
  share_calendar: boolean;
  share_content: boolean;
}

interface Props {
  initialStatus: "pending" | "accepted" | null;
  initialParentEmail: string | null;
  initialPreferences: SharingPreferences;
  parentPackNotionUrl: string;
}

type PendingAction =
  | "send"
  | "resend"
  | "cancel"
  | "unlink"
  | "update-sharing"
  | null;

const inputClassName =
  "w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none transition-colors";

const toggleButtonClassName =
  "relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60";

function ChecklistIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M9 11l2 2 4-4" />
      <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z" />
      <path d="M14 2v5h5" />
      <path d="M9 13h6M9 17h4" />
    </svg>
  );
}

function SharingToggleRow({
  checked,
  description,
  disabled,
  icon,
  onChange,
  title,
}: {
  checked: boolean;
  description: string;
  disabled: boolean;
  icon: React.ReactNode;
  onChange: (checked: boolean) => void;
  title: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--text)]">
          {icon}
        </div>
        <div>
          <p className="font-primary text-sm font-semibold text-[var(--text)]">{title}</p>
          <p className="text-sm text-[var(--text-muted)]">{description}</p>
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`${toggleButtonClassName} ${checked ? "bg-[var(--accent)]" : "bg-[var(--bg-subtle)]"}`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

export function ParentPackManager({
  initialStatus,
  initialParentEmail,
  initialPreferences,
  parentPackNotionUrl,
}: Props) {
  const [status, setStatus] = useState<"pending" | "accepted" | null>(initialStatus);
  const [parentEmail, setParentEmail] = useState(initialParentEmail ?? "");
  const [inputEmail, setInputEmail] = useState("");
  const [preferences, setPreferences] = useState<SharingPreferences>(initialPreferences);
  const [savedPreferences, setSavedPreferences] =
    useState<SharingPreferences>(initialPreferences);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setStatus(initialStatus);
    setParentEmail(initialParentEmail ?? "");
    setPreferences(initialPreferences);
    setSavedPreferences(initialPreferences);
  }, [initialParentEmail, initialPreferences, initialStatus]);

  useEffect(() => {
    if (!successMsg) return;
    const timeout = window.setTimeout(() => setSuccessMsg(""), 2500);
    return () => window.clearTimeout(timeout);
  }, [successMsg]);

  const disableSharingEdit = status === "pending" || pendingAction === "send";
  const isBusy = pendingAction !== null || isPending;
  const hasUnsavedSharingChanges =
    status === "accepted" &&
    (preferences.share_tasks !== savedPreferences.share_tasks ||
      preferences.share_calendar !== savedPreferences.share_calendar ||
      preferences.share_content !== savedPreferences.share_content);

  function handlePreferenceChange(
    key: keyof SharingPreferences,
    value: boolean
  ) {
    if (disableSharingEdit) return;
    setPreferences((current) => ({ ...current, [key]: value }));
    setError("");
    setSuccessMsg("");
  }

  function handleCancelSharingChanges() {
    setPreferences(savedPreferences);
    setError("");
    setSuccessMsg("");
  }

  function handleSaveSharingChanges() {
    if (!hasUnsavedSharingChanges) return;

    const nextPreferences = preferences;
    setPendingAction("update-sharing");
    setError("");
    setSuccessMsg("");

    startTransition(async () => {
      const result = await updateParentSharing(nextPreferences);
      if (result.success) {
        setSavedPreferences(nextPreferences);
        setSuccessMsg("Saved");
      } else {
        setError(result.error);
      }
      setPendingAction(null);
    });
  }

  async function handleSend() {
    setPendingAction("send");
    setError("");
    setSuccessMsg("");

    try {
      const result = await sendParentInvitation(inputEmail, preferences);
      if (result.success) {
        setStatus("pending");
        setParentEmail(inputEmail);
        setSuccessMsg("Invitation sent.");
      } else {
        setError(result.error);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleResend() {
    setPendingAction("resend");
    setError("");
    setSuccessMsg("");
    try {
      const result = await resendParentInvitation();
      if (result.success) {
        setSuccessMsg("Invitation resent.");
      } else {
        setError(result.error);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleCancel() {
    setPendingAction("cancel");
    setError("");
    setSuccessMsg("");
    try {
      const result = await cancelParentInvitation();
      if (result.success) {
        setStatus(null);
        setParentEmail("");
        setInputEmail("");
        setSuccessMsg("Invitation cancelled.");
      } else {
        setError(result.error);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleUnlink() {
    setPendingAction("unlink");
    setError("");
    setSuccessMsg("");
    try {
      const result = await unlinkParent();
      if (result.success) {
        setStatus(null);
        setParentEmail("");
        setInputEmail("");
        setShowUnlinkConfirm(false);
        setSuccessMsg("Parent access removed.");
      } else {
        setError(result.error);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border border-[var(--border)]" padding="md">
        <h2 className="font-primary text-2xl font-bold tracking-tight text-[var(--text)]">
          Invite a Parent
        </h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Give a parent access to support your UStart journey. They&apos;ll get their
          own login and can see what you choose to share.
        </p>
      </Card>

      <Card className="border border-[var(--border)]" padding="md">
        <h3 className="font-primary text-lg font-bold text-[var(--text)]">
          Choose what to share
        </h3>
        <p className="mb-4 mt-1 text-sm text-[var(--text-muted)]">
          You&apos;re in control. Toggle what your parent can see at any time.
        </p>

        <div className="space-y-3">
          <SharingToggleRow
            checked={preferences.share_tasks}
            description="Your task list and progress"
            disabled={disableSharingEdit || isBusy}
            icon={<ChecklistIcon />}
            onChange={(checked) => handlePreferenceChange("share_tasks", checked)}
            title="My Plan & Tasks"
          />
          <SharingToggleRow
            checked={preferences.share_calendar}
            description="Your task schedule and due dates"
            disabled={disableSharingEdit || isBusy}
            icon={<CalendarIcon />}
            onChange={(checked) => handlePreferenceChange("share_calendar", checked)}
            title="My Calendar"
          />
          <SharingToggleRow
            checked={preferences.share_content}
            description="Your UStart resources and guides"
            disabled={disableSharingEdit || isBusy}
            icon={<DocumentIcon />}
            onChange={(checked) => handlePreferenceChange("share_content", checked)}
            title="My Content"
          />
        </div>

        {status === "pending" && (
          <p className="mt-4 text-xs text-[var(--text-muted)]">
            Sharing preferences will become editable after your parent accepts the invitation.
          </p>
        )}

        {status === "accepted" && successMsg && (
          <p className="mt-4 text-xs text-emerald-600">{successMsg}</p>
        )}

        {status === "accepted" && hasUnsavedSharingChanges && (
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              onClick={handleSaveSharingChanges}
              disabled={isBusy}
              size="sm"
            >
              {pendingAction === "update-sharing" ? "Saving…" : "Save changes"}
            </Button>
            <Button
              onClick={handleCancelSharingChanges}
              disabled={isBusy}
              size="sm"
              variant="ghost"
            >
              Cancel
            </Button>
          </div>
        )}
      </Card>

      {status === null && (
        <Card className="border border-[var(--border)]" padding="md">
          <label
            htmlFor="parent-email"
            className="mb-2 block font-primary text-sm font-semibold text-[var(--text)]"
          >
            Parent&apos;s email address
          </label>
          <input
            id="parent-email"
            type="email"
            value={inputEmail}
            onChange={(event) => setInputEmail(event.target.value)}
            placeholder="name@example.com"
            className={inputClassName}
          />
          <div className="mt-4">
            <Button
              onClick={handleSend}
              disabled={isBusy || inputEmail.trim().length === 0}
              size="sm"
            >
              {pendingAction === "send" ? "Sending…" : "Send invitation →"}
            </Button>
          </div>
        </Card>
      )}

      {status === "pending" && (
        <Card className="border border-[var(--border)]" padding="md">
          <p className="font-primary text-lg font-semibold text-[var(--text)]">
            Invitation sent to {parentEmail}
          </p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Waiting for your parent to accept.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={handleResend} disabled={isBusy} size="sm" variant="ghost">
              {pendingAction === "resend" ? "Resending…" : "Resend invitation"}
            </Button>
            <Button onClick={handleCancel} disabled={isBusy} size="sm" variant="ghost">
              {pendingAction === "cancel" ? "Cancelling…" : "Cancel invitation"}
            </Button>
          </div>
          {successMsg && <p className="mt-4 text-xs text-emerald-600">{successMsg}</p>}
        </Card>
      )}

      {status === "accepted" && (
        <>
          <Card className="border border-[var(--border)]" padding="md">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-primary text-lg font-semibold text-[var(--text)]">
                  Connected to {parentEmail}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Connected
                </span>
                <button
                  type="button"
                  onClick={() => setShowUnlinkConfirm(true)}
                  className="text-sm text-[var(--destructive)] transition-opacity hover:opacity-80"
                >
                  Remove parent access
                </button>
              </div>
            </div>

            {showUnlinkConfirm && (
              <div className="mt-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-4">
                <p className="text-sm text-[var(--text)]">
                  Are you sure? This will remove your parent&apos;s access.
                </p>
                <div className="mt-4 flex gap-3">
                  <Button
                    onClick={handleUnlink}
                    disabled={isBusy}
                    size="sm"
                    variant="destructive"
                  >
                    {pendingAction === "unlink" ? "Removing…" : "Confirm"}
                  </Button>
                  <Button
                    onClick={() => setShowUnlinkConfirm(false)}
                    disabled={isBusy}
                    size="sm"
                    variant="ghost"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </Card>

          <Card className="border border-[var(--border)]" padding="md">
            <h3 className="font-primary text-lg font-semibold text-[var(--text)]">
              Parent Pack Resources
            </h3>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Access exclusive resources for your parent&apos;s journey
            </p>
            {parentPackNotionUrl ? (
              <a
                href={parentPackNotionUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex min-h-9 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--accent)] px-3.5 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[var(--accent-hover)]"
              >
                Open Parent Pack →
              </a>
            ) : (
              <p className="mt-4 text-sm text-[var(--text-muted)]">
                Parent Pack resources URL is not configured yet.
              </p>
            )}
          </Card>
        </>
      )}

      {error && <p className="text-sm text-[var(--destructive)]">{error}</p>}
    </div>
  );
}
