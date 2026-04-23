"use client";

import Link from "next/link";
import { type PlanTask, type PlanTaskStatus } from "@/lib/types/plan";

interface TaskCardProps {
  task: PlanTask;
  phaseColor: string;
  status: PlanTaskStatus;
  onToggle: (taskId: string, newStatus: PlanTaskStatus) => void;
  readOnly?: boolean;
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
}: TaskCardProps) {
  const isOverdue = isOverdueTask({ ...task, status });
  const dueDateLabel = formatDueDate(task.due_date, isOverdue);

  function handleToggleStatus() {
    onToggle(task.id, nextStatus(status));
  }

  const CardContainer = readOnly ? "div" : "button";

  return (
    <div className="flex w-full items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-1 shadow-[var(--shadow-sm)] transition-colors hover:bg-[var(--bg-card-hover)]">
      <CardContainer
        {...(readOnly
          ? {}
          : {
              type: "button" as const,
              onClick: handleToggleStatus,
              "aria-label": `${task.title} status ${status}`,
            })}
        className={`flex min-w-0 flex-1 items-center gap-4 rounded-[calc(var(--radius-md)-4px)] px-3 py-3 text-left ${
          readOnly ? "cursor-default" : ""
        }`}
      >
        <span className="shrink-0">
          {renderStatusIndicator(status, phaseColor)}
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[var(--text)]">{task.title}</p>
          {dueDateLabel && (
            <p
              className={`mt-1 text-xs ${
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
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: phaseColor }}
          aria-hidden="true"
          data-testid={`task-phase-dot-${task.id}`}
        />
      </CardContainer>

      <div className="flex shrink-0 items-center pr-3">
        {task.content_url && (
          <Link
            href={task.content_url}
            target="_blank"
            rel="noreferrer"
            className="text-[var(--accent)] transition-colors hover:text-[var(--accent-hover)]"
            aria-label={`Open ${task.title} resource`}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
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
