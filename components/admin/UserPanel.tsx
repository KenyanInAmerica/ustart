"use client";

import { useEffect, useState, useTransition } from "react";
import { useFlashMessage } from "@/hooks/useFlashMessage";
import { Button } from "@/components/ui/Button";
import { PlanTaskEditModal } from "@/components/admin/PlanTaskEditModal";
import { PlanTaskAddModal } from "@/components/admin/PlanTaskAddModal";
import { accentSurfaceClass, type ProductAccent } from "@/lib/config/productAccents";
import type { AdminUser } from "@/types/admin";
import { setUserAddon, setUserMembershipTier } from "@/lib/actions/admin/users";
import { reinstantiatePlan } from "@/lib/actions/plan";
import {
  adminFetchUserPlanTasks,
  adminDeletePlanTask,
} from "@/lib/actions/admin/planTasks";
import { getHubSpotSearchUrl } from "@/lib/hubspot/contacts";
import {
  PLAN_PHASES,
  PLAN_PHASE_LABELS,
  PLAN_PHASE_COLORS,
  PLAN_PHASE_BG_CLASSES,
  PLAN_PHASE_BORDER_CLASSES,
  type PlanTask,
} from "@/lib/types/plan";

// Module-level constant — NEXT_PUBLIC_* vars are baked in at build time.
const hubspotEnabled = !!process.env.NEXT_PUBLIC_HUBSPOT_ENABLED;

type Tier = "lite" | "explore" | "concierge" | null;

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

// Inline SVG icons — kept small so there's no external icon dependency.
function PencilIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

export function UserPanel({ user, onClose }: UserPanelProps) {
  const [stagedTier, setStagedTier] = useState<Tier>(null);
  const [stagedParentPack, setStagedParentPack] = useState(false);
  const [committedTier, setCommittedTier] = useState<Tier>(null);
  const [committedParentPack, setCommittedParentPack] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useFlashMessage();
  const [isSaving, startSaveTransition] = useTransition();
  const [planError, setPlanError] = useState<string | null>(null);
  const [planSuccess, setPlanSuccess] = useFlashMessage();
  const [isReinstantiating, startPlanTransition] = useTransition();
  const [hubspotUrl, setHubspotUrl] = useState<string | null>(null);

  // Plan task state
  const [tasks, setTasks] = useState<PlanTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<PlanTask | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [isDeletingTask, startDeleteTransition] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Reset all panel state when the selected user changes.
  useEffect(() => {
    if (!user) return;
    const tier = initialTier(user);
    const parentPack = initialParentPack(user);
    setStagedTier(tier);
    setStagedParentPack(parentPack);
    setCommittedTier(tier);
    setCommittedParentPack(parentPack);
    setSaveError(null);
    setSaveSuccessMsg(null);
    setPlanError(null);
    setPlanSuccess(null);
    setHubspotUrl(null);
    setTasks([]);
    setTasksLoading(false);
    setTaskError(null);
    setEditingTask(null);
    setShowAddModal(false);
    setDeletingTaskId(null);
    setDeleteError(null);
  }, [user, setSaveSuccessMsg, setPlanSuccess]);

  // Load plan tasks whenever the panel opens for a new user.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setTasksLoading(true);
    setTaskError(null);
    adminFetchUserPlanTasks(user.id)
      .then((result) => { if (!cancelled) setTasks(result); })
      .catch(() => { if (!cancelled) setTaskError("Failed to load tasks."); })
      .finally(() => { if (!cancelled) setTasksLoading(false); });
    return () => { cancelled = true; };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!hubspotEnabled || !user?.email) return;
    fetch(
      `/api/admin/hubspot-contact-url?email=${encodeURIComponent(user.email)}`
    )
      .then((r) => r.json())
      .then((data: { url: string | null }) => setHubspotUrl(data.url ?? null))
      .catch(() => {});
  }, [user?.email]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!user) return null;

  const userId = user.id;

  const isDirty =
    stagedTier !== committedTier || stagedParentPack !== committedParentPack;

  function loadTasks() {
    setTasksLoading(true);
    setTaskError(null);
    adminFetchUserPlanTasks(userId)
      .then(setTasks)
      .catch(() => setTaskError("Failed to load tasks."))
      .finally(() => setTasksLoading(false));
  }

  function handleCancel() {
    onClose();
  }

  function handleSave() {
    setSaveError(null);
    setSaveSuccessMsg(null);
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
        setSaveSuccessMsg("Changes saved successfully.");
        setCommittedTier(stagedTier);
        setCommittedParentPack(stagedParentPack);
      }
    });
  }

  function handleReinstantiatePlan() {
    setPlanError(null);
    setPlanSuccess(null);

    startPlanTransition(async () => {
      const result = await reinstantiatePlan(userId);
      if (!result.success) {
        setPlanError(result.error);
        return;
      }

      setPlanSuccess(
        result.taskCount === 0
          ? "Plan reinstantiated. No tasks were created."
          : `Plan reinstantiated. ${result.taskCount} tasks created.`
      );
      // Refresh the task list to reflect the newly created tasks.
      loadTasks();
    });
  }

  function handleDeleteTask(taskId: string) {
    setDeleteError(null);
    startDeleteTransition(async () => {
      const result = await adminDeletePlanTask(taskId);
      if (!result.success) {
        setDeleteError(result.error);
        return;
      }
      setDeletingTaskId(null);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    });
  }

  function handleTaskSaved(updated: PlanTask) {
    setEditingTask(null);
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  }

  function handleTaskAdded() {
    setShowAddModal(false);
    loadTasks();
  }

  // Status dot appearance varies by completion state.
  function statusDotClass(task: PlanTask): string {
    if (task.status === "completed") {
      return `h-2 w-2 rounded-full shrink-0 ${PLAN_PHASE_BG_CLASSES[task.phase]}`;
    }
    if (task.status === "in_progress") {
      return `h-2 w-2 rounded-full shrink-0 opacity-50 ${PLAN_PHASE_BG_CLASSES[task.phase]}`;
    }
    return `h-2 w-2 rounded-full shrink-0 border ${PLAN_PHASE_BORDER_CLASSES[task.phase]}`;
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
            {hubspotEnabled && (
              <a
                href={hubspotUrl ?? getHubSpotSearchUrl(user.email)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#FF7A59" }}
              >
                {/* HubSpot sprocket icon */}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M18.164 9.013a5.188 5.188 0 0 0 1.386-.367V5.698a2.164 2.164 0 1 0-2.164 0v2.046a5.19 5.19 0 0 0-2.62 1.402L8.63 6.388a2.913 2.913 0 1 0-.812 1.421l6.124 2.757a5.149 5.149 0 0 0-.08 4.576L10.97 16.74a2.913 2.913 0 1 0 .966 1.248l2.893-1.598a5.19 5.19 0 1 0 3.335-7.377z" />
                </svg>
                View in HubSpot
              </a>
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

          {/* ── Plan section ──────────────────────────────────────────────────── */}
          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
              Plan
            </h3>

            {/* Action row */}
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleReinstantiatePlan}
                disabled={isReinstantiating}
              >
                {isReinstantiating ? "Reinstantiating…" : "Reinstantiate plan"}
              </Button>
              <Button size="sm" onClick={() => setShowAddModal(true)}>
                + Add task
              </Button>
            </div>

            <p className="mb-3 text-xs text-[var(--text-muted)]">
              Reinstantiate rebuilds template-based tasks. Admin-added tasks (no template) are preserved.
            </p>

            {planError && (
              <p className="mb-2 text-[12px] text-[var(--destructive)]">{planError}</p>
            )}
            {planSuccess && (
              <p className="mb-2 text-[12px] text-emerald-600">{planSuccess}</p>
            )}

            {/* Task list */}
            <p className="mb-3 text-xs text-[var(--text-muted)]">
              Tasks below are specific to this user. Changes here do not affect the master template set.
            </p>
            {tasksLoading ? (
              <p className="text-xs text-[var(--text-muted)]">Loading tasks…</p>
            ) : taskError ? (
              <p className="text-xs text-[var(--destructive)]">{taskError}</p>
            ) : tasks.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)]">No tasks yet.</p>
            ) : (
              <div className="space-y-4">
                {PLAN_PHASES.map((phase) => {
                  const phaseTasks = tasks.filter((t) => t.phase === phase);
                  if (phaseTasks.length === 0) return null;
                  return (
                    <div key={phase}>
                      {/* Phase heading with accent dot */}
                      <div className="mb-1.5 flex items-center gap-1.5">
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${PLAN_PHASE_BG_CLASSES[phase]}`}
                          style={{ backgroundColor: PLAN_PHASE_COLORS[phase] }}
                        />
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                          {PLAN_PHASE_LABELS[phase]}
                        </span>
                      </div>

                      <div className="space-y-1">
                        {phaseTasks.map((task) => (
                          <div key={task.id}>
                            {/* Task row */}
                            <div className="flex items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 hover:bg-[var(--bg-subtle)]">
                              <span className={statusDotClass(task)} />
                              <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--text)]">
                                {task.title}
                              </span>
                              {task.due_date && (
                                <span className="shrink-0 text-[11px] text-[var(--text-muted)]">
                                  {formatPanelDate(task.due_date)}
                                </span>
                              )}
                              <button
                                onClick={() => setEditingTask(task)}
                                className="shrink-0 text-[var(--text-muted)] transition-colors hover:text-[var(--accent)]"
                                aria-label={`Edit ${task.title}`}
                              >
                                <PencilIcon />
                              </button>
                              <button
                                onClick={() =>
                                  setDeletingTaskId(
                                    deletingTaskId === task.id ? null : task.id
                                  )
                                }
                                className="shrink-0 text-[var(--text-muted)] transition-colors hover:text-[var(--destructive)]"
                                aria-label={`Delete ${task.title}`}
                              >
                                <TrashIcon />
                              </button>
                            </div>

                            {/* Inline delete confirmation */}
                            {deletingTaskId === task.id && (
                              <div className="mx-2 mb-1 rounded-[var(--radius-sm)] border border-[var(--border-md)] bg-[var(--bg-subtle)] px-3 py-2">
                                <p className="mb-2 text-[12px] text-[var(--text)]">
                                  Delete &ldquo;{task.title}&rdquo;?
                                </p>
                                <div className="flex gap-2">
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    loading={isDeletingTask}
                                    onClick={() => handleDeleteTask(task.id)}
                                  >
                                    Delete
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={isDeletingTask}
                                    onClick={() => {
                                      setDeletingTaskId(null);
                                      setDeleteError(null);
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                                {deleteError && (
                                  <p className="mt-1.5 text-[11px] text-[var(--destructive)]">
                                    {deleteError}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
          {saveSuccessMsg && <p className="text-[12px] text-emerald-600">{saveSuccessMsg}</p>}
          <div className="flex gap-3">
            <Button onClick={handleSave} disabled={isSaving || !isDirty} className="flex-1">
              {isSaving ? "Saving…" : "Save changes"}
            </Button>
            <Button onClick={handleCancel} variant="secondary">
              Cancel
            </Button>
          </div>
        </div>
      </aside>

      {/* Modals rendered outside the scrollable aside so fixed positioning is unambiguous */}
      {editingTask && (
        <PlanTaskEditModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSave={handleTaskSaved}
        />
      )}
      {showAddModal && (
        <PlanTaskAddModal
          userId={userId}
          onClose={() => setShowAddModal(false)}
          onSave={handleTaskAdded}
        />
      )}
    </>
  );
}
