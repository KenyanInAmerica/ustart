"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { adminUpdatePlanTask } from "@/lib/actions/admin/planTasks";
import type { PlanTask, PlanTaskStatus } from "@/lib/types/plan";

interface PlanTaskEditModalProps {
  task: PlanTask;
  onClose: () => void;
  onSave: (updated: PlanTask) => void;
}

const inputClassName =
  "w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none";
const labelClassName = "mb-1 block text-[11px] font-medium text-[var(--text-muted)]";

const STATUS_OPTIONS: { value: PlanTaskStatus; label: string }[] = [
  { value: "not_started", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
];

export function PlanTaskEditModal({ task, onClose, onSave }: PlanTaskEditModalProps) {
  const [title, setTitle] = useState(task.title);
  const [status, setStatus] = useState<PlanTaskStatus>(task.status);
  const [dueDate, setDueDate] = useState(task.due_date ?? "");
  const [contentUrl, setContentUrl] = useState(task.content_url ?? "");
  const [description, setDescription] = useState(task.description ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isDirty =
    title !== task.title ||
    status !== task.status ||
    dueDate !== (task.due_date ?? "") ||
    contentUrl !== (task.content_url ?? "") ||
    description !== (task.description ?? "");

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await adminUpdatePlanTask(task.id, {
        title,
        status,
        due_date: dueDate || null,
        content_url: contentUrl.trim() || null,
        description: description.trim() || null,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      // Optimistically reconstruct the updated task for the parent list.
      const updatedCompletedAt =
        status === "completed"
          ? (task.completed_at ?? new Date().toISOString())
          : null;

      onSave({
        ...task,
        title: title.trim() || task.title,
        status,
        due_date: dueDate || null,
        content_url: contentUrl.trim() || null,
        description: description.trim() || null,
        completed_at: updatedCompletedAt,
      });
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
            Edit task
          </h3>

          <div className="space-y-4">
            <div>
              <label htmlFor="edit-task-title" className={labelClassName}>
                Title
              </label>
              <input
                id="edit-task-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputClassName}
              />
            </div>

            <div>
              <label htmlFor="edit-task-status" className={labelClassName}>
                Status
              </label>
              <select
                id="edit-task-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as PlanTaskStatus)}
                className={inputClassName}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="edit-task-due-date" className={labelClassName}>
                Due date
              </label>
              <input
                id="edit-task-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={inputClassName}
              />
            </div>

            <div>
              <label htmlFor="edit-task-content-url" className={labelClassName}>
                Content URL
              </label>
              <input
                id="edit-task-content-url"
                type="text"
                value={contentUrl}
                onChange={(e) => setContentUrl(e.target.value)}
                placeholder="https://..."
                className={inputClassName}
              />
            </div>

            <div>
              <label htmlFor="edit-task-description" className={labelClassName}>
                Notes / description
              </label>
              <textarea
                id="edit-task-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className={`${inputClassName} resize-none`}
              />
            </div>
          </div>

          {error && (
            <p className="mt-3 text-xs text-[var(--destructive)]">{error}</p>
          )}

          <div className="mt-5 flex gap-2">
            <Button onClick={handleSubmit} loading={isPending} disabled={!isDirty || isPending} size="sm">
              Save changes
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
