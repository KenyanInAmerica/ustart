// Slide-out panel for managing a single user's membership tier and add-ons.
// Changes are staged locally — nothing is written to the database until Save is clicked.
// Cancel resets staged state back to the values loaded when the panel opened.
// Individual PDF assignments are managed separately in the Content section.

"use client";

import { useEffect, useState, useTransition } from "react";
import type { AdminUser } from "@/types/admin";
import {
  setUserMembershipTier,
  setUserAddon,
} from "@/lib/actions/admin/users";

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

const TIER_OPTIONS: { value: Tier; label: string }[] = [
  { value: null, label: "No plan" },
  { value: "lite", label: "Lite" },
  { value: "pro", label: "Pro" },
  { value: "premium", label: "Premium" },
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
  // Staged tier and addon state — mutated locally, not persisted until Save.
  const [stagedTier, setStagedTier] = useState<Tier>(null);
  const [stagedAddons, setStagedAddons] = useState<StagedAddons>({
    explore: false,
    concierge: false,
    parent_pack: false,
  });

  // Committed snapshot — reflects the last successfully saved state so isDirty
  // resets to false immediately after save without waiting for the parent to
  // re-fetch and pass an updated user prop.
  const [committedTier, setCommittedTier] = useState<Tier>(null);
  const [committedAddons, setCommittedAddons] = useState<StagedAddons>({
    explore: false,
    concierge: false,
    parent_pack: false,
  });

  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, startSaveTransition] = useTransition();

  // Re-initialise staged and committed state whenever a new user is opened.
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

  // Close on Escape key.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!user) return null;

  // Derive whether staged state differs from the last committed (saved) snapshot.
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

    // Capture current committed snapshot for diffing — avoids closure staleness.
    const savedTier = committedTier;
    const savedAddons = committedAddons;

    startSaveTransition(async () => {
      const errors: string[] = [];

      // Tier change — diff against committed snapshot, not the prop.
      if (stagedTier !== savedTier) {
        const result = await setUserMembershipTier(user!.id, stagedTier);
        if (!result.success) errors.push(`Tier: ${result.error}`);
      }

      // Addon changes — diff against committed snapshot.
      for (const key of ["explore", "concierge", "parent_pack"] as Addon[]) {
        if (stagedAddons[key] !== savedAddons[key]) {
          const result = await setUserAddon(user!.id, key, stagedAddons[key]);
          if (!result.success) errors.push(`${key}: ${result.error}`);
        }
      }

      if (errors.length > 0) {
        setSaveError(errors.join(" — "));
      } else {
        setSaveSuccess(true);
        // Advance committed snapshot to match what was just saved so isDirty
        // resets to false without waiting for the parent to re-fetch the user prop.
        setCommittedTier(stagedTier);
        setCommittedAddons(stagedAddons);
      }
    });
  }

  return (
    <>
      {/* Overlay — click to close */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside className="fixed right-0 top-0 h-screen w-[420px] bg-[#0C1220] border-l border-white/[0.07] z-50 flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-5 border-b border-white/[0.07]">
          <div>
            <p className="text-[13px] text-white/50 mb-0.5">Managing user</p>
            <p className="text-white font-medium text-[14px] break-all">{user.email}</p>
            {(user.first_name || user.last_name) && (
              <p className="text-[13px] text-white/60 mt-0.5">
                {[user.first_name, user.last_name].filter(Boolean).join(" ")}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors mt-0.5 shrink-0"
            aria-label="Close panel"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 px-6 py-5 space-y-6">
          {/* Membership Tier */}
          <section>
            <h3 className="text-[12px] font-medium tracking-[0.06em] uppercase text-white/40 mb-3">
              Membership tier
            </h3>
            <div className="flex flex-wrap gap-2">
              {TIER_OPTIONS.map((opt) => (
                <button
                  key={String(opt.value)}
                  onClick={() => setStagedTier(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-[13px] transition-colors border ${
                    stagedTier === opt.value
                      ? "bg-white/[0.10] text-white border-white/20"
                      : "text-white/60 border-white/[0.08] hover:text-white hover:border-white/20"
                  }`}
                >
                  {opt.label}
                  {/* Mark changed from committed snapshot */}
                  {opt.value !== committedTier && stagedTier === opt.value && (
                    <span className="ml-1.5 text-[10px] text-amber-400">unsaved</span>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* Add-ons */}
          <section>
            <h3 className="text-[12px] font-medium tracking-[0.06em] uppercase text-white/40 mb-3">
              Add-ons
            </h3>
            <div className="space-y-2">
              {(
                [
                  { key: "explore" as Addon, label: "Explore" },
                  { key: "concierge" as Addon, label: "Concierge" },
                  { key: "parent_pack" as Addon, label: "Parent Pack" },
                ] as { key: Addon; label: string }[]
              ).map(({ key, label }) => {
                const active = stagedAddons[key];
                const changed = active !== committedAddons[key];
                return (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-[13px] text-white/70">
                      {label}
                      {changed && (
                        <span className="ml-1.5 text-[10px] text-amber-400">unsaved</span>
                      )}
                    </span>
                    <button
                      role="switch"
                      aria-checked={active}
                      onClick={() =>
                        setStagedAddons((prev) => ({ ...prev, [key]: !prev[key] }))
                      }
                      className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border border-white/10 transition-colors ${
                        active ? "bg-emerald-500/80" : "bg-white/[0.08]"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform mt-[1px] ${
                          active ? "translate-x-4" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Footer — Save / Cancel */}
        <div className="px-6 py-4 border-t border-white/[0.07] space-y-3">
          {saveError && (
            <p className="text-red-400 text-[12px]">{saveError}</p>
          )}
          {saveSuccess && (
            <p className="text-emerald-400 text-[12px]">Changes saved successfully.</p>
          )}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving || !isDirty}
              className="flex-1 px-4 py-2 bg-white text-[#0C1220] text-[13px] font-medium rounded-lg hover:bg-white/90 transition-colors disabled:opacity-40"
            >
              {isSaving ? "Saving…" : "Save changes"}
            </button>
            <button
              onClick={handleCancel}
              disabled={isSaving || !isDirty}
              className="px-4 py-2 text-[13px] text-white/60 border border-white/[0.10] rounded-lg hover:text-white hover:border-white/30 transition-colors disabled:opacity-40"
            >
              Cancel
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
