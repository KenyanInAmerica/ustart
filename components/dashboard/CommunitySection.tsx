"use client";

import { useState } from "react";
import Link from "next/link";
import { acceptCommunityRules } from "@/lib/actions/acceptCommunityRules";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface CommunitySectionProps {
  hasAgreedToCommunity: boolean;
  phoneNumber: string | null;
  whatsappLink: string;
}

const PHONE_REGEX = /^\+[1-9]\d{6,14}$/;

export function CommunitySection({
  hasAgreedToCommunity,
  phoneNumber,
  whatsappLink,
}: CommunitySectionProps) {
  const [agreed, setAgreed] = useState(hasAgreedToCommunity);
  const [checked, setChecked] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [phone, setPhone] = useState(phoneNumber ?? "");
  const [inputError, setInputError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleCheckboxChange(e: React.ChangeEvent<HTMLInputElement>) {
    setChecked(e.target.checked);
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

  if (agreed) {
    return (
      <Card className="relative border border-[var(--border)] pl-7" padding="md">
        <div className="absolute inset-y-0 left-0 w-1 rounded-l-[var(--radius-lg)] bg-[#4ECBA5]" aria-hidden="true" />
        <p className="mb-1 font-primary text-sm font-bold text-[var(--text)]">
          Community
        </p>
        <p className="mb-4 font-primary text-xs leading-relaxed text-[var(--text-muted)]">
          Your community access is active. Connect with fellow UStart members navigating life in the US.
        </p>
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-fit items-center justify-center rounded-[var(--radius-sm)] bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[var(--accent-hover)]"
        >
          Open WhatsApp group
        </a>
      </Card>
    );
  }

  return (
    <>
      <Card className="relative border border-[var(--border)] pl-7" padding="md">
        <div className="absolute inset-y-0 left-0 w-1 rounded-l-[var(--radius-lg)] bg-[#4ECBA5]" aria-hidden="true" />
        <p className="mb-1 font-primary text-sm font-bold text-[var(--text)]">
          Community
        </p>
        <p className="mb-3 font-primary text-xs leading-relaxed text-[var(--text-muted)]">
          Be respectful. No spam. Support each other. This is a space for
          UStart members only.
        </p>
        <Link
          href="/community-rules"
          target="_blank"
          rel="noopener noreferrer"
          className="mb-4 block font-primary text-xs text-[var(--text-muted)] underline transition-colors hover:text-[var(--text)]"
        >
          Read the full rules →
        </Link>
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={checked}
            onChange={handleCheckboxChange}
            className="mt-0.5 cursor-pointer accent-[var(--accent)]"
          />
          <span className="font-primary text-xs text-[var(--text-muted)]">
            I have read and agreed to the community rules.
          </span>
        </label>
      </Card>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-navy/40 backdrop-blur-sm"
            aria-hidden="true"
          />
          <div className="relative w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-lg)]">
            <h2 className="mb-2 font-primary text-lg font-bold text-[var(--text)]">
              One last step
            </h2>
            <p className="mb-5 font-primary text-sm leading-relaxed text-[var(--text-muted)]">
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
                className="w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-subtle)] px-4 py-3 text-sm text-[var(--text)] transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none"
              />
              {inputError && (
                <p className="mt-1.5 text-xs text-[var(--destructive)]">{inputError}</p>
              )}
              {submitError && (
                <p className="mt-1.5 text-xs text-[var(--destructive)]">{submitError}</p>
              )}
              <div className="mt-5 flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" loading={loading}>
                  Confirm
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
