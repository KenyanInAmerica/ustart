"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  cancelParentInvitation,
  resendParentInvitation,
  sendParentInvitation,
  unlinkParent,
} from "@/lib/actions/parentInvitation";

const PARENT_INVITATION_ENABLED = false;

interface Props {
  initialStatus: string | null;
  initialParentEmail: string | null;
}

const inputClassName =
  "flex-1 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none transition-colors";

export function ParentInvitationSection({
  initialStatus,
  initialParentEmail,
}: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [parentEmail, setParentEmail] = useState(initialParentEmail ?? "");
  const [inputEmail, setInputEmail] = useState("");
  const [pendingAction, setPendingAction] = useState<
    "send" | "resend" | "cancel" | "unlink" | null
  >(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const isLoading = pendingAction !== null;

  if (!PARENT_INVITATION_ENABLED) return null;

  function showSuccess(message: string, autoHideMs?: number) {
    setSuccessMsg(message);
    if (autoHideMs) {
      setTimeout(() => setSuccessMsg(""), autoHideMs);
    }
  }

  async function handleSend() {
    setPendingAction("send");
    setError("");
    try {
      const result = await sendParentInvitation(inputEmail);
      if (result.success) {
        setParentEmail(inputEmail);
        setStatus("pending");
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
        showSuccess("Invitation resent successfully.", 3000);
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
        setSuccessMsg("Invitation cancelled.");
        setTimeout(() => {
          setStatus(null);
          setParentEmail("");
          setInputEmail("");
          setSuccessMsg("");
        }, 1500);
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
        setShowConfirm(false);
        setSuccessMsg("Parent unlinked successfully.");
        setTimeout(() => {
          setStatus(null);
          setParentEmail("");
          setSuccessMsg("");
        }, 1500);
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
    <Card className="border border-[var(--border)]" padding="md">
      <p className="mb-4 font-primary text-sm font-bold text-[var(--text)]">
        Invite a Parent
      </p>

      {status === null && (
        <div>
          <p className="mb-4 font-primary text-sm text-[var(--text-muted)]">
            You can invite one parent to access UStart. They will have their own
            login and will be able to view your content and dedicated parent
            resources.
          </p>
          <div className="flex gap-2">
            <input
              type="email"
              value={inputEmail}
              onChange={(event) => setInputEmail(event.target.value)}
              placeholder="Parent's email address"
              className={inputClassName}
            />
            <Button
              onClick={handleSend}
              disabled={isLoading || !inputEmail}
              size="sm"
            >
              {pendingAction === "send" ? "Sending…" : "Send Invitation"}
            </Button>
          </div>
        </div>
      )}

      {status === "pending" && (
        <div>
          <p className="mb-4 font-primary text-sm text-[var(--text-muted)]">
            Invitation sent to{" "}
            <span className="text-[var(--text)]">{parentEmail}</span>
          </p>
          <div className="flex gap-3">
            <Button onClick={handleResend} disabled={isLoading} size="sm" variant="ghost">
              {pendingAction === "resend" ? "Resending…" : "Resend invitation"}
            </Button>
            <Button onClick={handleCancel} disabled={isLoading} size="sm" variant="ghost">
              {pendingAction === "cancel" ? "Cancelling…" : "Cancel invitation"}
            </Button>
          </div>
        </div>
      )}

      {status === "accepted" && (
        <div>
          <p className="mb-4 font-primary text-sm text-[var(--text-muted)]">
            Your parent <span className="text-[var(--text)]">{parentEmail}</span>{" "}
            has accepted the invitation and has access to UStart.
          </p>
          {showConfirm ? (
            <div>
              <p className="mb-3 font-primary text-sm text-[var(--text-muted)]">
                Are you sure? Your parent will lose access to UStart.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={handleUnlink}
                  disabled={isLoading}
                  size="sm"
                  variant="destructive"
                >
                  {pendingAction === "unlink" ? "Unlinking…" : "Yes, unlink"}
                </Button>
                <Button
                  onClick={() => setShowConfirm(false)}
                  disabled={isLoading}
                  size="sm"
                  variant="ghost"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => setShowConfirm(true)}
              disabled={isLoading}
              size="sm"
              variant="ghost"
            >
              Unlink parent
            </Button>
          )}
        </div>
      )}

      {error && (
        <p className="mt-4 font-primary text-xs text-[var(--destructive)]">
          {error}
        </p>
      )}

      {successMsg && (
        <p className="mt-4 font-primary text-xs text-emerald-600">
          {successMsg}
        </p>
      )}
    </Card>
  );
}
