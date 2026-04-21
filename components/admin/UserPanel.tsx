"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { accentSurfaceClass, type ProductAccent } from "@/lib/config/productAccents";
import type { AdminUser } from "@/types/admin";
import { setUserAddon, setUserMembershipTier } from "@/lib/actions/admin/users";

type Tier = "lite" | "pro" | "premium" | null;
type Addon = "explore" | "concierge" | "parent_pack";

interface StagedAddons {
  explore: boolean;
  concierge: boolean;
  parent_pack: boolean;
}

interface UserPanelProps {
  user: AdminUser | null;
  onClose: () => void;
}

const TIER_OPTIONS: { value: Tier; label: string; accent: ProductAccent }[] = [
  { value: null, label: "No plan", accent: "default" },
  { value: "lite", label: "Lite", accent: "lite" },
  { value: "pro", label: "Pro", accent: "pro" },
  { value: "premium", label: "Premium", accent: "premium" },
];

function initialTier(user: AdminUser): Tier {
  return (user.membership_tier as Tier) ?? null;
}

function initialAddons(user: AdminUser): StagedAddons {
  return {
    explore: user.has_explore,
    concierge: user.has_concierge,
    parent_pack: user.has_parent_seat,
  };
}

export function UserPanel({ user, onClose }: UserPanelProps) {
  const [stagedTier, setStagedTier] = useState<Tier>(null);
  const [stagedAddons, setStagedAddons] = useState<StagedAddons>({
    explore: false,
    concierge: false,
    parent_pack: false,
  });
  const [committedTier, setCommittedTier] = useState<Tier>(null);
  const [committedAddons, setCommittedAddons] = useState<StagedAddons>({
    explore: false,
    concierge: false,
    parent_pack: false,
  });
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, startSaveTransition] = useTransition();

  useEffect(() => {
    if (!user) return;
    const tier = initialTier(user);
    const addons = initialAddons(user);
    setStagedTier(tier);
    setStagedAddons(addons);
    setCommittedTier(tier);
    setCommittedAddons(addons);
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
    stagedTier !== committedTier ||
    stagedAddons.explore !== committedAddons.explore ||
    stagedAddons.concierge !== committedAddons.concierge ||
    stagedAddons.parent_pack !== committedAddons.parent_pack;

  function handleCancel() {
    setStagedTier(committedTier);
    setStagedAddons(committedAddons);
    setSaveError(null);
    setSaveSuccess(false);
  }

  function handleSave() {
    setSaveError(null);
    setSaveSuccess(false);
    const userId = user!.id;
    const savedTier = committedTier;
    const savedAddons = committedAddons;

    startSaveTransition(async () => {
      const errors: string[] = [];

      if (stagedTier !== savedTier) {
        const result = await setUserMembershipTier(userId, stagedTier);
        if (!result.success) errors.push(`Tier: ${result.error}`);
      }

      for (const key of ["explore", "concierge", "parent_pack"] as Addon[]) {
        if (stagedAddons[key] !== savedAddons[key]) {
          const result = await setUserAddon(userId, key, stagedAddons[key]);
          if (!result.success) errors.push(`${key}: ${result.error}`);
        }
      }

      if (errors.length > 0) {
        setSaveError(errors.join(" — "));
      } else {
        setSaveSuccess(true);
        setCommittedTier(stagedTier);
        setCommittedAddons(stagedAddons);
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
              Add-ons
            </h3>
            <div className="space-y-3">
              {(
                [
                  { key: "explore" as Addon, label: "Explore", accent: "explore" as ProductAccent },
                  { key: "concierge" as Addon, label: "Concierge", accent: "concierge" as ProductAccent },
                  { key: "parent_pack" as Addon, label: "Parent Pack", accent: "parent_pack" as ProductAccent },
                ]
              ).map(({ key, label, accent }) => {
                const active = stagedAddons[key];
                const changed = active !== committedAddons[key];
                return (
                  <div key={key} className="flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--border)] bg-white px-3 py-2.5">
                    <span className="text-[13px] font-medium text-[var(--text)]">
                      {label}
                      {changed && (
                        <span className="ml-1.5 text-[10px] text-yellow-700">unsaved</span>
                      )}
                    </span>
                    <button
                      role="switch"
                      aria-checked={active}
                      onClick={() => setStagedAddons((prev) => ({ ...prev, [key]: !prev[key] }))}
                      className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border transition-colors ${
                        active ? accentSurfaceClass(accent) : "border-[var(--border)] bg-white"
                      }`}
                    >
                      <span
                        className={`mt-[1px] inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                          active ? "translate-x-4" : "translate-x-0.5 border border-[var(--border)]"
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
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
