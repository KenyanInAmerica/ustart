"use client";

import { useState } from "react";
import {
  sendParentInvitation,
  resendParentInvitation,
  cancelParentInvitation,
  unlinkParent,
} from "@/lib/actions/parentInvitation";

interface Props {
  initialStatus: string | null;
  initialParentEmail: string | null;
}

// Client component — manages the three invitation states locally so the UI
// transitions without a full page reload after each action.
export function ParentInvitationSection({ initialStatus, initialParentEmail }: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [parentEmail, setParentEmail] = useState(initialParentEmail ?? "");
  const [inputEmail, setInputEmail] = useState("");
  // Tracks which button is in-flight so each shows its own loading label.
  const [pendingAction, setPendingAction] = useState<"send" | "resend" | "cancel" | "unlink" | null>(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  // Inline confirm gate before executing the irreversible unlink action.
  const [showConfirm, setShowConfirm] = useState(false);

  const isLoading = pendingAction !== null;

  // Shows a success message and optionally clears it after `autoHideMs` ms.
  function showSuccess(msg: string, autoHideMs?: number) {
    setSuccessMsg(msg);
    if (autoHideMs) setTimeout(() => setSuccessMsg(""), autoHideMs);
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
        // Leave status null (State 1) so the user can correct the input and retry.
        setError(result.error);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      // Always clear loading — prevents the button getting stuck disabled on throws.
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
        // Auto-dismiss after 3 s — the pending state card stays visible.
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
        // Brief confirmation visible before the form resets to State 1.
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
    <div className="bg-[#0C1220] border border-white/[0.07] rounded-2xl p-5">
      <p className="font-syne text-sm font-bold text-white mb-4">Invite a Parent</p>

      {/* State 1 — no invitation sent */}
      {status === null && (
        <div>
          <p className="font-dm-sans text-sm text-white/[0.54] mb-4">
            You can invite one parent to access UStart. They will have their own login and will be able to view your content and dedicated parent resources.
          </p>
          <div className="flex gap-2">
            <input
              type="email"
              value={inputEmail}
              onChange={(e) => setInputEmail(e.target.value)}
              placeholder="Parent's email address"
              className="flex-1 bg-white/[0.04] border border-white/[0.10] rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/[0.28] focus:outline-none focus:border-white/[0.28] transition-colors"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !inputEmail}
              className="font-dm-sans text-sm text-[#05080F] bg-white px-4 py-2 rounded-xl hover:bg-white/90 transition-colors disabled:opacity-50"
            >
              {pendingAction === "send" ? "Sending…" : "Send Invitation"}
            </button>
          </div>
        </div>
      )}

      {/* State 2 — invitation pending */}
      {status === "pending" && (
        <div>
          <p className="font-dm-sans text-sm text-white/[0.68] mb-4">
            Invitation sent to <span className="text-white">{parentEmail}</span>
          </p>
          <div className="flex gap-4">
            <button
              onClick={handleResend}
              disabled={isLoading}
              className="font-dm-sans text-xs text-white/[0.42] hover:text-white transition-colors disabled:opacity-50"
            >
              {pendingAction === "resend" ? "Resending…" : "Resend invitation"}
            </button>
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="font-dm-sans text-xs text-white/[0.42] hover:text-white transition-colors disabled:opacity-50"
            >
              {pendingAction === "cancel" ? "Cancelling…" : "Cancel invitation"}
            </button>
          </div>
        </div>
      )}

      {/* State 3 — invitation accepted */}
      {status === "accepted" && (
        <div>
          <p className="font-dm-sans text-sm text-white/[0.68] mb-4">
            Your parent <span className="text-white">{parentEmail}</span> has accepted the invitation and has access to UStart.
          </p>
          {showConfirm ? (
            <div>
              <p className="font-dm-sans text-sm text-white/[0.54] mb-3">
                Are you sure? Your parent will lose access to UStart.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={handleUnlink}
                  disabled={isLoading}
                  className="font-dm-sans text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                >
                  {pendingAction === "unlink" ? "Unlinking…" : "Yes, unlink"}
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  disabled={isLoading}
                  className="font-dm-sans text-xs text-white/[0.42] hover:text-white transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirm(true)}
              disabled={isLoading}
              className="font-dm-sans text-xs text-white/[0.42] hover:text-white transition-colors disabled:opacity-50"
            >
              Unlink parent
            </button>
          )}
        </div>
      )}

      {successMsg && (
        <p className="font-dm-sans text-xs text-green-400 mt-3">{successMsg}</p>
      )}
      {error && (
        <p className="font-dm-sans text-xs text-red-400 mt-3">{error}</p>
      )}
    </div>
  );
}
