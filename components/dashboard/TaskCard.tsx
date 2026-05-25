"use client";

import Link from "next/link";
import { type PlanTask, type PlanTaskStatus } from "@/lib/types/plan";

interface TaskCardProps {
  task: PlanTask;
  phaseColor: string;
  status: PlanTaskStatus;
  onToggle: (taskId: string, newStatus: PlanTaskStatus) => void;
  readOnly?: boolean;
  video_url?: string | null;
}

function nextStatus(status: PlanTaskStatus): PlanTaskStatus {
  switch (status) {
    case "not_started":
      return "in_progress";
    case "in_progress":
      return "completed";
    default:
      return "not_started";
  }
}

function formatDueDate(dueDate: string | null, isOverdue: boolean): string | null {
  if (!dueDate) return null;
  if (isOverdue) return "Overdue";

  const parsed = new Date(`${dueDate}T00:00:00.000Z`);
  return `Due ${new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(parsed)}`;
}

function isOverdueTask(task: PlanTask): boolean {
  if (!task.due_date || task.status === "completed") return false;
  const today = new Date();
  const todayUtc = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate()
  );
  const dueUtc = Date.parse(`${task.due_date}T00:00:00.000Z`);
  return dueUtc < todayUtc;
}

export function TaskCard({
  task,
  phaseColor,
  status,
  onToggle,
  readOnly = false,
  video_url,
}: TaskCardProps) {
  const isOverdue = isOverdueTask({ ...task, status });
  const dueDateLabel = formatDueDate(task.due_date, isOverdue);

  function handleToggleStatus() {
    onToggle(task.id, nextStatus(status));
  }

  const isInternalUrl = !!task.content_url?.startsWith("/");
  const contentHref = task.content_url
    ? isInternalUrl
      ? `${task.content_url}?from=plan`
      : task.content_url
    : null;

  return (
    <div className="flex w-full items-start gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)]">
      {/* Status toggle — only this element is interactive for toggling */}
      {readOnly ? (
        <span className="mt-0.5 shrink-0">
          {renderStatusIndicator(status, phaseColor)}
        </span>
      ) : (
        <button
          type="button"
          onClick={handleToggleStatus}
          aria-label={`${task.title} status ${status}`}
          className="mt-0.5 shrink-0"
        >
          {renderStatusIndicator(status, phaseColor)}
        </button>
      )}

      {/* Task content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium leading-snug text-[var(--text)]">{task.title}</p>
            {dueDateLabel && (
              <p
                className={`mt-0.5 text-xs ${
                  isOverdue ? "text-[var(--destructive)]" : "text-[var(--text-muted)]"
                }`}
              >
                {dueDateLabel}
              </p>
            )}
            {task.description && (
              <p className="mt-1 truncate text-xs text-[var(--text-muted)]">
                {task.description}
              </p>
            )}
          </div>
          <span
            className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: phaseColor }}
            aria-hidden="true"
            data-testid={`task-phase-dot-${task.id}`}
          />
        </div>

        {(contentHref || video_url) && (
          <div className="flex items-center gap-3 mt-2">
            {contentHref && (
              <Link
                href={contentHref}
                {...(!isInternalUrl ? { target: "_blank", rel: "noreferrer" } : {})}
                className="inline-flex items-center gap-1 text-[var(--accent)] text-xs font-medium hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                View Content →
              </Link>
            )}
            {video_url && (
              <a
                href={video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[var(--text-muted)] text-xs hover:text-[var(--text)]"
                onClick={(e) => e.stopPropagation()}
              >
                ▶ Watch video
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function renderStatusIndicator(status: PlanTaskStatus, phaseColor: string) {
  if (status === "completed") {
    return (
      <span
        className="flex h-6 w-6 items-center justify-center rounded-full border-2 text-white"
        style={{ borderColor: phaseColor, backgroundColor: phaseColor }}
      >
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
      </span>
    );
  }

  if (status === "in_progress") {
    return (
      <span
        className="flex h-6 w-6 items-center justify-center rounded-full border-2"
        style={{ borderColor: phaseColor, backgroundColor: `${phaseColor}33` }}
      >
        <svg width="10" height="2" viewBox="0 0 10 2" aria-hidden="true">
          <rect width="10" height="2" rx="1" fill={phaseColor} />
        </svg>
        <span className="sr-only">In progress</span>
      </span>
    );
  }

  return (
    <span className="block h-6 w-6 rounded-full border-2 border-[var(--border-hi)] bg-white" />
  );
}
