"use client";

// Slide-out contact panel anchored to the bottom-right of the viewport.
// Two variants:
//   - Unauthenticated: name + email + message fields
//   - Authenticated:   name + email pre-populated and read-only; message only
//
// Success message auto-dismisses after 3 s and closes the panel.

import { useState, useEffect } from "react";
import { useUser } from "@/hooks/useUser";
import { createClient } from "@/lib/supabase/client";
import { submitContactForm } from "@/lib/actions/contactForm";

interface ContactPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ContactPanel({ isOpen, onClose }: ContactPanelProps) {
  const { user, loading: userLoading } = useUser();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  // Tracks whether the profile fetch has completed (regardless of whether a name
  // was found). When true and name is still empty, we show an editable input so
  // the user can fill in their name instead of being stuck on "Loading…".
  const [profileLoaded, setProfileLoaded] = useState(false);

  // When an authenticated user opens the panel, pre-populate name + email
  // from their profile. One lightweight client-side query — avoids prop-drilling
  // auth data through every layout that renders Footer.
  useEffect(() => {
    if (!user || !isOpen) return;

    setEmail(user.email);
    setProfileLoaded(false);

    const supabase = createClient();
    supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const raw = data as {
          first_name: string | null;
          last_name: string | null;
        } | null;
        const fullName = [raw?.first_name, raw?.last_name]
          .filter(Boolean)
          .join(" ");
        if (fullName) setName(fullName);
        // Always mark loaded so the UI unblocks even when no name is on file.
        setProfileLoaded(true);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isOpen]);

  // Auto-dismiss success banner and close panel after 3 s.
  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [success, onClose]);

  // Close on Escape key.
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // Reset form state when panel closes so stale messages don't flash on re-open.
  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setSuccess(false);
      setMessage("");
      setProfileLoaded(false);
      // Only reset name/email for unauthenticated users.
      if (!user) {
        setName("");
        setEmail("");
      }
    }
  }, [isOpen, user]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const result = await submitContactForm({ name, email, message });

    setSubmitting(false);

    if (result.success) {
      setSuccess(true);
      setMessage("");
    } else {
      setError(result.error);
    }
  }

  if (!isOpen) return null;

  const isAuthenticated = !userLoading && user !== null;

  return (
    <>
      {/* Invisible backdrop — clicking anywhere outside closes the panel */}
      <div
        className="fixed inset-0 z-[200]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out panel — bottom-right, above backdrop */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Contact UStart"
        className="fixed bottom-0 right-0 z-[201] w-full max-w-[420px] bg-[#0C1220] border border-white/[0.08] rounded-tl-2xl shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Panel header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
          <h2 className="font-syne font-bold text-base text-white">
            Contact Us
          </h2>
          <button
            onClick={onClose}
            aria-label="Close contact panel"
            className="text-white/40 hover:text-white transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex-1 overflow-y-auto">
          {/* Success state */}
          {success && (
            <div className="rounded-lg bg-white/[0.07] border border-white/[0.10] px-4 py-3 text-[13.5px] text-white/80 text-center">
              Message sent — we&apos;ll be in touch soon.
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
              {/* Name field */}
              <div>
                <label className="block text-[12px] font-medium text-white/50 mb-1.5" htmlFor="contact-name">
                  Name
                </label>
                {isAuthenticated && (profileLoaded ? name : false) ? (
                  // Read-only display only when the profile has a name on file
                  <div
                    id="contact-name"
                    className="bg-white/[0.03] border border-white/[0.07] rounded-lg px-3 py-2.5 text-[13.5px] text-white/50 select-none"
                    aria-label={`Name: ${name}`}
                  >
                    {name}
                  </div>
                ) : isAuthenticated && !profileLoaded ? (
                  // Still fetching — show a non-interactive placeholder
                  <div
                    id="contact-name"
                    className="bg-white/[0.03] border border-white/[0.07] rounded-lg px-3 py-2.5 text-[13.5px] text-white/25 select-none"
                    aria-label="Name: Loading…"
                  >
                    Loading…
                  </div>
                ) : (
                  <input
                    id="contact-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full bg-white/[0.05] border border-white/[0.10] rounded-lg px-3 py-2.5 text-[13.5px] text-white placeholder:text-white/30 outline-none focus:border-white/30 transition-colors"
                  />
                )}
              </div>

              {/* Email field */}
              <div>
                <label className="block text-[12px] font-medium text-white/50 mb-1.5" htmlFor="contact-email">
                  Email
                </label>
                {isAuthenticated ? (
                  <div
                    id="contact-email"
                    className="bg-white/[0.03] border border-white/[0.07] rounded-lg px-3 py-2.5 text-[13.5px] text-white/50 select-none truncate"
                    aria-label={`Email: ${email}`}
                  >
                    {email}
                  </div>
                ) : (
                  <input
                    id="contact-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-white/[0.05] border border-white/[0.10] rounded-lg px-3 py-2.5 text-[13.5px] text-white placeholder:text-white/30 outline-none focus:border-white/30 transition-colors"
                  />
                )}
              </div>

              {/* Message field — always editable */}
              <div>
                <label className="block text-[12px] font-medium text-white/50 mb-1.5" htmlFor="contact-message">
                  Message
                </label>
                <textarea
                  id="contact-message"
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can we help?"
                  className="w-full bg-white/[0.05] border border-white/[0.10] rounded-lg px-3 py-2.5 text-[13.5px] text-white placeholder:text-white/30 outline-none focus:border-white/30 transition-colors resize-none"
                />
              </div>

              {/* Inline error */}
              {error && (
                <p className="text-[13px] text-red-400" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting || !message.trim()}
                className="w-full bg-white text-[#05080F] font-medium text-[14px] py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? "Sending…" : "Send message"}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
