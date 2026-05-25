"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { adminAddPlanTask } from "@/lib/actions/admin/planTasks";
import {
  PLAN_PHASES,
  PLAN_PHASE_LABELS,
  type PlanPhase,
} from "@/lib/types/plan";

interface PlanTaskAddModalProps {
  userId: string;
  onClose: () => void;
  onSave: () => void;
}

const inputClassName =
  "w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none";
const labelClassName = "mb-1 block text-[11px] font-medium text-[var(--text-muted)]";

export function PlanTaskAddModal({ userId, onClose, onSave }: PlanTaskAddModalProps) {
  const [title, setTitle] = useState("");
  const [phase, setPhase] = useState<PlanPhase>("before_arrival");
  const [dueDate, setDueDate] = useState("");
  const [contentUrl, setContentUrl] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    setError(null);
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    startTransition(async () => {
      const result = await adminAddPlanTask(userId, {
        title,
        phase,
        due_date: dueDate || null,
        content_url: contentUrl.trim() || null,
        description: description.trim() || null,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      onSave();
    });
  }

  return (
    <>
      {/* Backdrop — sits above the UserPanel (z-50) */}
      <div
        className="fixed inset-0 z-[60] bg-black/30"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-[var(--radius-md)] bg-white p-6 shadow-xl">
          <h3 className="mb-4 font-primary text-sm font-semibold text-[var(--text)]">
            Add task
          </h3>

          <div className="space-y-4">
            <div>
              <label htmlFor="add-task-title" className={labelClassName}>
                Title <span className="text-[var(--destructive)]">*</span>
              </label>
              <input
                id="add-task-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Open a bank account"
                className={inputClassName}
              />
            </div>

            <div>
              <label htmlFor="add-task-phase" className={labelClassName}>
                Phase
              </label>
              <select
                id="add-task-phase"
                value={phase}
                onChange={(e) => setPhase(e.target.value as PlanPhase)}
                className={inputClassName}
              >
                {PLAN_PHASES.map((p) => (
                  <option key={p} value={p}>
                    {PLAN_PHASE_LABELS[p]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="add-task-due-date" className={labelClassName}>
                Due date (optional)
              </label>
              <input
                id="add-task-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={inputClassName}
              />
            </div>

            <div>
              <label htmlFor="add-task-content-url" className={labelClassName}>
                Content URL (optional)
              </label>
              <input
                id="add-task-content-url"
                type="text"
                value={contentUrl}
                onChange={(e) => setContentUrl(e.target.value)}
                placeholder="https://..."
                className={inputClassName}
              />
            </div>

            <div>
              <label htmlFor="add-task-description" className={labelClassName}>
                Description (optional)
              </label>
              <textarea
                id="add-task-description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional notes about this task"
                className={`${inputClassName} resize-none`}
              />
            </div>
          </div>

          {error && (
            <p className="mt-3 text-xs text-[var(--destructive)]">{error}</p>
          )}

          <div className="mt-5 flex gap-2">
            <Button onClick={handleSubmit} loading={isPending} size="sm">
              Add task
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
