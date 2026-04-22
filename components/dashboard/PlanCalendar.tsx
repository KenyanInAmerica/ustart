"use client";

import { useMemo, useState } from "react";
import Calendar from "react-calendar";
import Link from "next/link";
import {
  PLAN_PHASE_COLORS,
  type PlanTask,
  type PlanTaskStatus,
} from "@/lib/types/plan";

interface PlanCalendarProps {
  tasks: PlanTask[];
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getStatusBadgeClasses(status: PlanTaskStatus): string {
  switch (status) {
    case "in_progress":
      return "bg-[#F5C842]/20 text-yellow-700";
    case "completed":
      return "bg-[#4ECBA5]/20 text-[#4ECBA5]";
    default:
      return "bg-[var(--bg-subtle)] text-[var(--text-muted)]";
  }
}

export function PlanCalendar({ tasks }: PlanCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const tasksByDate = useMemo(() => {
    const map = new Map<string, { color: string; count: number }>();

    for (const task of tasks) {
      if (!task.due_date) continue;

      const current = map.get(task.due_date);
      if (current) {
        current.count += 1;
        continue;
      }

      map.set(task.due_date, {
        color: PLAN_PHASE_COLORS[task.phase],
        count: 1,
      });
    }

    return map;
  }, [tasks]);

  const selectedDateKey = formatDateKey(selectedDate);
  const selectedTasks = tasks
    .filter((task) => task.due_date === selectedDateKey)
    .sort((left, right) => left.display_order - right.display_order);

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-sm)]">
      <div className="mb-3">
        <p className="text-sm font-semibold text-[var(--text)]">Schedule</p>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Track task dates across your plan.
        </p>
      </div>

      <Calendar
        onChange={(value) =>
          setSelectedDate(
            value instanceof Date
              ? value
              : Array.isArray(value) && value[0] instanceof Date
                ? value[0]
                : new Date()
          )
        }
        value={selectedDate}
        tileContent={({ date, view }) => {
          if (view !== "month") return null;

          const marker = tasksByDate.get(formatDateKey(date));
          if (!marker) return null;

          return (
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: marker.color,
                margin: "2px auto 0",
              }}
            />
          );
        }}
      />

      <div className="mt-4 border-t border-[var(--border)] pt-4">
        {selectedTasks.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">
            No tasks scheduled for this date.
          </p>
        ) : (
          <>
            <p className="mb-2 text-sm font-semibold text-[var(--text)]">
              {new Intl.DateTimeFormat("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
              }).format(selectedDate)}
            </p>
            <div className="space-y-2.5">
              {selectedTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)]/50 px-3 py-2"
                >
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: PLAN_PHASE_COLORS[task.phase] }}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1 text-sm text-[var(--text)]">
                    {task.title}
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-medium ${getStatusBadgeClasses(
                      task.status
                    )}`}
                  >
                    {task.status === "not_started"
                      ? "Not started"
                      : task.status === "in_progress"
                        ? "In progress"
                        : "Completed"}
                  </span>
                  {task.content_url && (
                    <Link
                      href={task.content_url}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 text-[var(--accent)] transition-colors hover:text-[var(--accent-hover)]"
                      aria-label={`Open ${task.title} resource`}
                    >
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        aria-hidden="true"
                      >
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                      </svg>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
