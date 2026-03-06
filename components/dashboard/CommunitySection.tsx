"use client";

import { useState } from "react";
import Link from "next/link";
import { acceptCommunityRules } from "@/lib/actions/acceptCommunityRules";

interface CommunitySectionProps {
  hasAgreedToCommunity: boolean;
  phoneNumber: string | null;
  whatsappLink: string;
}

// Matches the same regex used in the server action for consistent client-side feedback.
const PHONE_REGEX = /^\+[1-9]\d{6,14}$/;

export function CommunitySection({
  hasAgreedToCommunity,
  phoneNumber,
  whatsappLink,
}: CommunitySectionProps) {
  // Local agreed state flips to true after a successful submission so the
  // WhatsApp link appears immediately without a full page reload.
  const [agreed, setAgreed] = useState(hasAgreedToCommunity);
  const [checked, setChecked] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [phone, setPhone] = useState(phoneNumber ?? "");
  const [inputError, setInputError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleCheckboxChange(e: React.ChangeEvent<HTMLInputElement>) {
    setChecked(e.target.checked);
    // Opening the modal only on check — unchecking directly closes nothing.
    if (e.target.checked) setModalOpen(true);
  }

  function handleCancel() {
    setChecked(false);
    setModalOpen(false);
    setInputError("");
    setSubmitError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setInputError("");
    setSubmitError("");

    // Client-side guard — strip spaces first to mirror the server action.
    const stripped = phone.replace(/\s+/g, "");
    if (!PHONE_REGEX.test(stripped)) {
      setInputError(
        "Please enter a valid international number e.g. +1 234 567 8900"
      );
      return;
    }

    setLoading(true);
    const result = await acceptCommunityRules(stripped);
    setLoading(false);

    if (result.success) {
      setModalOpen(false);
      setAgreed(true);
    } else {
      setSubmitError(result.error);
    }
  }

  // ── Agreed state ──────────────────────────────────────────────────────────
  if (agreed) {
    return (
      <div className="bg-[#0C1220] border border-white/[0.07] rounded-2xl p-5">
        <p className="font-syne text-sm font-bold text-white mb-1">Community</p>
        <p className="font-dm-sans text-xs text-white/[0.42] leading-relaxed mb-4">
          Your community access is active. Connect with fellow UStart members navigating life in the US.
        </p>
        {/* WhatsApp CTA — rendered as a plain anchor since it links externally */}
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-medium text-white bg-[#25D366] px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
        >
          Open WhatsApp group →
        </a>
      </div>
    );
  }

  // ── Not yet agreed ────────────────────────────────────────────────────────
  return (
    <>
      <div className="bg-[#0C1220] border border-white/[0.07] rounded-2xl p-5">
        <p className="font-syne text-sm font-bold text-white mb-1">Community</p>
        <p className="font-dm-sans text-xs text-white/[0.42] leading-relaxed mb-3">
          Be respectful. No spam. Support each other. This is a space for
          UStart members only.
        </p>
        <Link
          href="/community-rules"
          target="_blank"
          rel="noopener noreferrer"
          className="font-dm-sans text-xs text-white/[0.42] hover:text-white/[0.70] underline transition-colors block mb-4"
        >
          Read the full rules →
        </Link>
        {/* Checking this opens the phone number modal */}
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={checked}
            onChange={handleCheckboxChange}
            className="mt-0.5 accent-white cursor-pointer"
          />
          <span className="font-dm-sans text-xs text-white/[0.42]">
            I have read and agreed to the community rules.
          </span>
        </label>
      </div>

      {/* Phone number modal — fixed overlay, shown when checkbox is checked */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            aria-hidden="true"
          />
          {/* Panel */}
          <div className="relative bg-[#0C1220] border border-white/[0.12] rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="font-syne text-lg font-bold text-white mb-2">
              One last step
            </h2>
            <p className="font-dm-sans text-sm text-white/[0.42] leading-relaxed mb-5">
              Enter your WhatsApp number so we can verify your membership.
            </p>
            <form onSubmit={handleSubmit}>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setInputError("");
                }}
                placeholder="+1 234 567 8900"
                className="w-full bg-white/[0.04] border border-white/[0.10] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/[0.28] focus:outline-none focus:border-white/[0.28] transition-colors"
              />
              {/* Input-level validation error */}
              {inputError && (
                <p className="text-xs text-red-400 mt-1.5">{inputError}</p>
              )}
              {/* Server-returned error */}
              {submitError && (
                <p className="text-xs text-red-400 mt-1.5">{submitError}</p>
              )}
              <div className="flex gap-3 mt-5">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 py-2.5 rounded-xl border border-white/[0.12] text-sm text-white/[0.42] hover:text-white hover:border-white/[0.28] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-white text-[#05080F] text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loading ? "Confirming…" : "Confirm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
