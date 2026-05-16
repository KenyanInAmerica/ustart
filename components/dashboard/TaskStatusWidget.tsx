"use client";

import { useState } from "react";
import { updateTaskStatus } from "@/lib/actions/plan";
import type { PlanTask, PlanTaskStatus } from "@/lib/types/plan";

interface TaskStatusWidgetProps {
  task: PlanTask;
  phaseColor: string;
  readOnly?: boolean;
}

function formatDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(dateStr));
}

export function TaskStatusWidget({
  task,
  phaseColor,
  readOnly = false,
}: TaskStatusWidgetProps) {
  const [currentStatus, setCurrentStatus] = useState<PlanTaskStatus>(task.status);
  const [currentTask, setCurrentTask] = useState<PlanTask>(task);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle(newStatus: PlanTaskStatus) {
    const prevStatus = currentStatus;
    setCurrentStatus(newStatus);
    setError(null);

    const result = await updateTaskStatus(task.id, newStatus);
    if (!result.success) {
      setCurrentStatus(prevStatus);
      setError("Failed to update task status.");
    } else {
      setCurrentTask((t) => ({
        ...t,
        completed_at: newStatus === "completed" ? new Date().toISOString() : null,
      }));
    }
  }

  const dueDateLabel = formatDate(currentTask.due_date);
  const completedAtLabel = formatDate(currentTask.completed_at);

  const statusCircleStyle =
    currentStatus === "completed"
      ? { borderColor: phaseColor, backgroundColor: phaseColor }
      : currentStatus === "in_progress"
      ? { borderColor: phaseColor, backgroundColor: `${phaseColor}33` }
      : { borderColor: "var(--border-hi)", backgroundColor: "white" };

  return (
    <div className="mb-6 rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-4">
      <div className="flex items-center justify-between gap-4">
        {/* Left: status indicator + task info */}
        <div className="flex items-center gap-3">
          <div
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2"
            style={statusCircleStyle}
          >
            {currentStatus === "completed" && (
              <svg width="10" height="8" viewBox="0 0 10 8" aria-hidden="true">
                <path
                  d="M1 4L3.5 6.5L9 1"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            )}
            {currentStatus === "in_progress" && (
              <svg width="10" height="2" viewBox="0 0 10 2" aria-hidden="true">
                <rect width="10" height="2" rx="1" fill={phaseColor} />
              </svg>
            )}
          </div>

          <div>
            <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              This is a task in your plan
            </p>
            <p className="text-sm font-medium text-[var(--text)]">{currentTask.title}</p>
            {dueDateLabel && (
              <p className="text-xs text-[var(--text-muted)]">
                Due {dueDateLabel}
                {completedAtLabel && ` · Completed ${completedAtLabel}`}
              </p>
            )}
          </div>
        </div>

        {/* Right: action buttons */}
        {!readOnly && (
          <div className="flex shrink-0 items-center gap-2">
            {currentStatus !== "completed" && (
              <button
                type="button"
                onClick={() => handleToggle("completed")}
                className="rounded-[var(--radius-sm)] border px-3 py-1.5 text-xs font-medium transition-colors"
                style={{
                  backgroundColor: `${phaseColor}1a`,
                  color: phaseColor,
                  borderColor: `${phaseColor}4d`,
                }}
              >
                Mark complete
              </button>
            )}
            {currentStatus === "completed" && (
              <button
                type="button"
                onClick={() => handleToggle("not_started")}
                className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--border)]"
              >
                Mark incomplete
              </button>
            )}
            {currentStatus === "not_started" && (
              <button
                type="button"
                onClick={() => handleToggle("in_progress")}
                className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--border)]"
              >
                Start task
              </button>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 text-xs text-[var(--destructive)]">{error}</p>
      )}
    </div>
  );
}
