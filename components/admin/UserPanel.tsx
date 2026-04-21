"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { accentSurfaceClass, type ProductAccent } from "@/lib/config/productAccents";
import type { AdminUser } from "@/types/admin";
import { setUserAddon, setUserMembershipTier } from "@/lib/actions/admin/users";

type Tier = "lite" | "explore" | "concierge" | null;
type Addon = "parent_pack";

interface UserPanelProps {
  user: AdminUser | null;
  onClose: () => void;
}

const TIER_OPTIONS: { value: Tier; label: string; accent: ProductAccent }[] = [
  { value: null, label: "No plan", accent: "default" },
  { value: "lite", label: "Lite", accent: "lite" },
  { value: "explore", label: "Explore", accent: "explore" },
  { value: "concierge", label: "Concierge", accent: "concierge" },
];

function initialTier(user: AdminUser): Tier {
  return (user.membership_tier as Tier) ?? null;
}

function initialParentPack(user: AdminUser): boolean {
  return user.has_parent_seat;
}

const INTAKE_CONCERN_LABELS: Record<string, string> = {
  banking_credit: "Banking & Credit",
  ssn: "SSN",
  housing: "Housing",
  transportation: "Transportation",
  health_insurance: "Health Insurance",
  tax_finance: "Tax & Finance",
  campus_life: "Campus Life",
  community_social: "Community & Social",
};

function formatPanelDate(value: string | null): string {
  if (!value) return "—";
  const parsed = new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

function formatPanelTimestamp(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

function formatMainConcerns(value: string | null): string {
  if (!value) return "—";
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => INTAKE_CONCERN_LABELS[part] ?? part)
    .join(", ");
}

export function UserPanel({ user, onClose }: UserPanelProps) {
  const [stagedTier, setStagedTier] = useState<Tier>(null);
  const [stagedParentPack, setStagedParentPack] = useState(false);
  const [committedTier, setCommittedTier] = useState<Tier>(null);
  const [committedParentPack, setCommittedParentPack] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, startSaveTransition] = useTransition();

  useEffect(() => {
    if (!user) return;
    const tier = initialTier(user);
    const parentPack = initialParentPack(user);
    setStagedTier(tier);
    setStagedParentPack(parentPack);
    setCommittedTier(tier);
    setCommittedParentPack(parentPack);
    setSaveError(null);
    setSaveSuccess(false);
  }, [user]);

  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => setSaveSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [saveSuccess]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!user) return null;

  const isDirty =
    stagedTier !== committedTier || stagedParentPack !== committedParentPack;

  function handleCancel() {
    setStagedTier(committedTier);
    setStagedParentPack(committedParentPack);
    setSaveError(null);
    setSaveSuccess(false);
  }

  function handleSave() {
    setSaveError(null);
    setSaveSuccess(false);
    const userId = user!.id;
    const savedTier = committedTier;
    const savedParentPack = committedParentPack;

    startSaveTransition(async () => {
      const errors: string[] = [];

      if (stagedTier !== savedTier) {
        const result = await setUserMembershipTier(userId, stagedTier);
        if (!result.success) errors.push(`Tier: ${result.error}`);
      }

      if (stagedParentPack !== savedParentPack) {
        const result = await setUserAddon(userId, "parent_pack", stagedParentPack);
        if (!result.success) errors.push(`parent_pack: ${result.error}`);
      }

      if (errors.length > 0) {
        setSaveError(errors.join(" — "));
      } else {
        setSaveSuccess(true);
        setCommittedTier(stagedTier);
        setCommittedParentPack(stagedParentPack);
      }
    });
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-navy/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <aside className="fixed right-0 top-0 z-50 flex h-screen w-[420px] flex-col overflow-y-auto border-l border-[var(--border)] bg-white">
        <div className="flex items-start justify-between border-b border-[var(--border)] px-6 pb-5 pt-6">
          <div>
            <p className="mb-0.5 text-[13px] text-[var(--text-muted)]">Managing user</p>
            <p className="break-all text-[14px] font-medium text-[var(--text)]">{user.email}</p>
            {(user.first_name || user.last_name) && (
              <p className="mt-0.5 text-[13px] text-[var(--text-mid)]">
                {[user.first_name, user.last_name].filter(Boolean).join(" ")}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="mt-0.5 shrink-0 text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
            aria-label="Close panel"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 space-y-6 px-6 py-5">
          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
              Membership tier
            </h3>
            <div className="flex flex-wrap gap-2">
              {TIER_OPTIONS.map((opt) => (
                <button
                  key={String(opt.value)}
                  onClick={() => setStagedTier(opt.value)}
                  className={`rounded-[var(--radius-sm)] border px-3 py-1.5 text-[13px] transition-colors ${
                    stagedTier === opt.value
                      ? accentSurfaceClass(opt.accent)
                      : "border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--text-mid)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text)]"
                  }`}
                >
                  {opt.label}
                  {opt.value !== committedTier && stagedTier === opt.value && (
                    <span className="ml-1.5 text-[10px] text-yellow-700">unsaved</span>
                  )}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
              Add-ons &amp; Calls
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--border)] bg-white px-3 py-2.5">
                <span className="text-[13px] font-medium text-[var(--text)]">
                  Parent Pack
                  {stagedParentPack !== committedParentPack && (
                    <span className="ml-1.5 text-[10px] text-yellow-700">unsaved</span>
                  )}
                </span>
                <button
                  role="switch"
                  aria-checked={stagedParentPack}
                  onClick={() => setStagedParentPack((prev) => !prev)}
                  className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border transition-colors ${
                    stagedParentPack
                      ? accentSurfaceClass("parent_pack")
                      : "border-[var(--border)] bg-white"
                  }`}
                >
                  <span
                    className={`mt-[1px] inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                      stagedParentPack
                        ? "translate-x-4"
                        : "translate-x-0.5 border border-[var(--border)]"
                    }`}
                  />
                </button>
              </div>

              {[
                { label: "1:1 Arrival Call", accent: "arrival_call" as ProductAccent },
                {
                  label: "Additional Support Call",
                  accent: "additional_support_call" as ProductAccent,
                },
              ].map(({ label, accent }) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--border)] bg-white px-3 py-2.5"
                >
                  <span className="text-[13px] font-medium text-[var(--text)]">
                    {label}
                  </span>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${accentSurfaceClass(
                      accent
                    )}`}
                  >
                    Read only
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
              Intake
            </h3>
            {user.intake_response ? (
              <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-white px-3">
                {[
                  { label: "School", value: user.intake_response.school ?? "—" },
                  { label: "City", value: user.intake_response.city ?? "—" },
                  {
                    label: "Arrival date",
                    value: formatPanelDate(user.intake_response.arrival_date),
                  },
                  {
                    label: "Graduation date",
                    value: formatPanelDate(user.intake_response.graduation_date),
                  },
                  {
                    label: "Main concerns",
                    value: formatMainConcerns(user.intake_response.main_concerns),
                  },
                  {
                    label: "Completed",
                    value: formatPanelTimestamp(user.intake_response.completed_at),
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex justify-between gap-4 border-b border-[var(--border)] py-1.5 last:border-0"
                  >
                    <span className="text-xs text-[var(--text-muted)]">{row.label}</span>
                    <span className="text-right text-sm text-[var(--text)]">{row.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--text-muted)]">
                No intake completed yet.
              </p>
            )}
          </section>
        </div>

        <div className="space-y-3 border-t border-[var(--border)] px-6 py-4">
          {saveError && <p className="text-[12px] text-[var(--destructive)]">{saveError}</p>}
          {saveSuccess && <p className="text-[12px] text-emerald-600">Changes saved successfully.</p>}
          <div className="flex gap-3">
            <Button onClick={handleSave} disabled={isSaving || !isDirty} className="flex-1">
              {isSaving ? "Saving…" : "Save changes"}
            </Button>
            <Button onClick={handleCancel} disabled={isSaving || !isDirty} variant="secondary">
              Cancel
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
