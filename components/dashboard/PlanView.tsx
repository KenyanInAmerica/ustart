"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { updateTaskStatus } from "@/lib/actions/plan";
import { ProgressRing } from "@/components/dashboard/ProgressRing";
import { PlanCalendar } from "@/components/dashboard/PlanCalendar";
import { TaskCard } from "@/components/dashboard/TaskCard";
import {
  PLAN_PHASE_BORDER_CLASSES,
  type PlanPhaseGroup,
  type PlanTaskStatus,
} from "@/lib/types/plan";

interface PlanViewProps {
  greeting: string;
  subtitle: string;
  initialPhaseGroups: PlanPhaseGroup[];
  intakeCompletedAt: string | null;
  children?: ReactNode;
}

function getCompletedCount(tasks: PlanPhaseGroup["tasks"]): number {
  return tasks.filter((task) => task.status === "completed").length;
}

function getOverallPercentage(phaseGroups: PlanPhaseGroup[]): number {
  const totalTasks = phaseGroups.reduce((sum, group) => sum + group.tasks.length, 0);
  const completedTasks = phaseGroups.reduce(
    (sum, group) => sum + getCompletedCount(group.tasks),
    0
  );

  return totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
}

export function PlanView({
  greeting,
  subtitle,
  initialPhaseGroups,
  intakeCompletedAt,
  children,
}: PlanViewProps) {
  const [phaseGroups, setPhaseGroups] = useState(initialPhaseGroups);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const requestIdsRef = useRef<Record<string, number>>({});

  useEffect(() => {
    setPhaseGroups(initialPhaseGroups);
  }, [initialPhaseGroups]);

  useEffect(() => {
    if (!errorMessage) return undefined;

    const timer = setTimeout(() => setErrorMessage(null), 2500);
    return () => clearTimeout(timer);
  }, [errorMessage]);

  const derivedPhaseGroups = useMemo(
    () =>
      phaseGroups.map((group) => ({
        ...group,
        completedCount: getCompletedCount(group.tasks),
        totalCount: group.tasks.length,
      })),
    [phaseGroups]
  );

  const allTasks = useMemo(
    () => derivedPhaseGroups.flatMap((group) => group.tasks),
    [derivedPhaseGroups]
  );
  const overallPercentage = useMemo(
    () => getOverallPercentage(derivedPhaseGroups),
    [derivedPhaseGroups]
  );

  function handleToggle(taskId: string, newStatus: PlanTaskStatus) {
    const previousTask = phaseGroups
      .flatMap((group) => group.tasks)
      .find((task) => task.id === taskId);

    if (!previousTask) return;

    const nextGroups = phaseGroups.map((group) => ({
      ...group,
      tasks: group.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: newStatus,
              completed_at:
                newStatus === "completed" ? new Date().toISOString() : null,
            }
          : task
      ),
    }));

    const requestId = (requestIdsRef.current[taskId] ?? 0) + 1;
    requestIdsRef.current[taskId] = requestId;
    setPhaseGroups(nextGroups);

    void updateTaskStatus(taskId, newStatus).then((result) => {
      if (result.success || requestIdsRef.current[taskId] !== requestId) return;

      setPhaseGroups((currentGroups) =>
        currentGroups.map((group) => ({
          ...group,
          tasks: group.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  status: previousTask.status,
                  completed_at: previousTask.completed_at,
                }
              : task
          ),
        }))
      );
      setErrorMessage(result.error || "Couldn't update task status.");
    });
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-primary text-2xl font-bold text-[var(--text)]">
            {greeting}
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{subtitle}</p>
        </div>
        <ProgressRing percentage={overallPercentage} size={80} label="Complete" color="#3083DC" />
      </div>

      {errorMessage && (
        <p className="rounded-[var(--radius-sm)] border border-[var(--destructive)]/20 bg-[var(--destructive)]/10 px-3 py-2 text-sm text-[var(--destructive)]">
          {errorMessage}
        </p>
      )}

      <div className="grid gap-6 md-900:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          {derivedPhaseGroups.length === 0 ? (
            <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-sm)]">
              <p className="text-lg font-semibold text-[var(--text)]">
                Your plan is being prepared.
              </p>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                Complete your profile setup to generate your personalised plan.
              </p>
              {!intakeCompletedAt && (
                <Link
                  href="/intake"
                  className="mt-4 inline-flex items-center justify-center rounded-[var(--radius-sm)] bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-hover)]"
                >
                  Complete profile setup
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="mb-6 flex flex-wrap items-center gap-4 px-1">
                <div className="flex items-center gap-1.5">
                  <span className="h-3.5 w-3.5 rounded-full border border-[var(--border-hi)] bg-white" />
                  <span className="text-xs text-[var(--text-muted)]">Not started</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-[var(--text-muted)] bg-[rgba(28,43,58,0.15)] text-[var(--text-muted)]">
                    <svg width="6" height="2" viewBox="0 0 6 2" aria-hidden="true">
                      <rect width="6" height="2" rx="1" fill="currentColor" />
                    </svg>
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">In progress</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#4ECBA5]">
                    <svg width="6" height="5" viewBox="0 0 10 8" aria-hidden="true">
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
                  <span className="text-xs text-[var(--text-muted)]">Done</span>
                </div>
                <span className="ml-auto text-xs italic text-[var(--text-muted)]">
                  Click a task to update its status
                </span>
              </div>

              {derivedPhaseGroups.map((group) => {
                const phasePercentage =
                  group.totalCount === 0
                    ? 0
                    : Math.round((group.completedCount / group.totalCount) * 100);

                return (
                  <section
                    key={group.phase}
                    className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-sm)]"
                  >
                    <div
                      className={`mb-4 border-l-4 pl-3 ${PLAN_PHASE_BORDER_CLASSES[group.phase]}`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h2 className="text-base font-semibold text-[var(--text)]">
                            {group.label}
                          </h2>
                          <p className="text-sm text-[var(--text-muted)]">
                            {group.completedCount}/{group.totalCount} tasks
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4 h-1.5 w-full rounded-full bg-[var(--bg-subtle)]">
                      <div
                        className="h-1.5 rounded-full transition-all duration-300 ease-out"
                        style={{
                          width: `${phasePercentage}%`,
                          backgroundColor: group.color,
                        }}
                      />
                    </div>

                    <div className="space-y-3">
                      {group.tasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          phaseColor={group.color}
                          status={task.status}
                          onToggle={handleToggle}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </>
          )}

          {children}

          {allTasks.length > 0 && (
            <div className="md-900:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsScheduleOpen(true)}
              >
                View schedule
                <span aria-hidden="true">→</span>
              </Button>
            </div>
          )}
        </div>

        <aside className="hidden md-900:block">
          <PlanCalendar tasks={allTasks} />
        </aside>
      </div>

      {isScheduleOpen && (
        <div className="fixed inset-0 z-[260] md-900:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-navy/30"
            onClick={() => setIsScheduleOpen(false)}
            aria-label="Close schedule drawer"
          />
          <div className="animate-fade-up absolute bottom-0 left-0 right-0 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-white p-4 shadow-[var(--shadow-lg)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-base font-semibold text-[var(--text)]">Schedule</p>
              <button
                type="button"
                onClick={() => setIsScheduleOpen(false)}
                className="text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
                aria-label="Close schedule drawer"
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden="true"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <PlanCalendar tasks={allTasks} />
          </div>
        </div>
      )}
    </div>
  );
}
