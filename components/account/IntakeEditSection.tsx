"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { updateIntake } from "@/lib/actions/intake";
import { recalculatePlanDueDates } from "@/lib/actions/plan";
import { useFlashMessage } from "@/hooks/useFlashMessage";
import {
  GRADUATION_TIMELINE_OPTIONS,
  MAIN_CONCERN_OPTIONS,
} from "@/lib/config/intakeOptions";

interface CurrentData {
  school: string | null;
  city: string | null;
  arrival_date: string | null;
  graduation_date: string | null;
  main_concerns: string | null;
}

interface IntakeEditSectionProps {
  currentData: CurrentData;
}

const inputClassName =
  "w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-subtle)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none";
const labelClassName = "mb-1 block font-primary text-[11px] text-[var(--text-muted)]";

// Parses the stored "banking_credit,other: some text" format back into form state.
function parseConcerns(raw: string | null): {
  selected: string[];
  other: string;
} {
  if (!raw) return { selected: [], other: "" };
  const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
  const selected: string[] = [];
  let other = "";
  for (const part of parts) {
    if (part.startsWith("other:")) {
      selected.push("other");
      other = part.slice("other:".length).trim();
    } else {
      selected.push(part);
    }
  }
  return { selected, other };
}

export function IntakeEditSection({ currentData }: IntakeEditSectionProps) {
  const parsedConcerns = parseConcerns(currentData.main_concerns);

  const [school, setSchool] = useState(currentData.school ?? "");
  const [city, setCity] = useState(currentData.city ?? "");
  const [arrivalDate, setArrivalDate] = useState(currentData.arrival_date ?? "");
  const [graduationDate, setGraduationDate] = useState(currentData.graduation_date ?? "");
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>(parsedConcerns.selected);
  const [otherConcern, setOtherConcern] = useState(parsedConcerns.other);

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useFlashMessage();
  const [showRecalculatePrompt, setShowRecalculatePrompt] = useState(false);
  const [recalcError, setRecalcError] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();
  const [isRecalcPending, startRecalcTransition] = useTransition();

  const otherSelected = selectedConcerns.includes("other");

  const isDirty =
    school !== (currentData.school ?? "") ||
    city !== (currentData.city ?? "") ||
    arrivalDate !== (currentData.arrival_date ?? "") ||
    graduationDate !== (currentData.graduation_date ?? "") ||
    selectedConcerns.length !== parsedConcerns.selected.length ||
    selectedConcerns.some((c) => !parsedConcerns.selected.includes(c)) ||
    (otherSelected && otherConcern !== parsedConcerns.other);

  function toggleConcern(value: string) {
    setSelectedConcerns((current) => {
      const exists = current.includes(value);
      const next = exists ? current.filter((k) => k !== value) : [...current, value];
      if (value === "other" && exists) setOtherConcern("");
      return next;
    });
  }

  function handleSaveClick() {
    setError(null);
    setSuccessMessage(null);
    startTransition(async () => {
      const result = await updateIntake({
        school: school.trim() || undefined,
        city: city.trim() || undefined,
        arrival_date: arrivalDate || undefined,
        graduation_date: graduationDate || undefined,
        main_concerns: selectedConcerns.length > 0 ? selectedConcerns : undefined,
        other_concern: otherSelected ? otherConcern : "",
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      if (result.arrivalDateChanged) {
        setShowRecalculatePrompt(true);
      } else {
        setSuccessMessage("Profile updated.");
      }
    });
  }

  function handleRecalculate() {
    setRecalcError(null);
    startRecalcTransition(async () => {
      const result = await recalculatePlanDueDates();
      if (!result.success) {
        setRecalcError(result.error);
        return;
      }
      setShowRecalculatePrompt(false);
      setSuccessMessage("Due dates updated.");
    });
  }

  return (
    <section className="mb-6">
      <h2 className="mb-4 font-primary text-[13px] font-bold uppercase tracking-[0.06em] text-[var(--text)]">
        Your Journey Details
      </h2>

      <Card className="border border-[var(--border)]" padding="md">
        <p className="mb-4 font-primary text-sm font-bold text-[var(--text)]">
          Update your profile
        </p>

        <div className="space-y-4">
          <div>
            <label htmlFor="intake-school" className={labelClassName}>
              School / University
            </label>
            <input
              id="intake-school"
              type="text"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              placeholder="e.g. University of Michigan"
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="intake-city" className={labelClassName}>
              City
            </label>
            <input
              id="intake-city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Ann Arbor, MI"
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="intake-arrival-date" className={labelClassName}>
              Arrival date
            </label>
            <input
              id="intake-arrival-date"
              type="date"
              value={arrivalDate}
              onChange={(e) => setArrivalDate(e.target.value)}
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="intake-graduation" className={labelClassName}>
              Graduation timeline
            </label>
            <div className="relative">
              <select
                id="intake-graduation"
                value={graduationDate}
                onChange={(e) => setGraduationDate(e.target.value)}
                className={`${inputClassName} appearance-none pr-8`}
              >
                <option value="">Select a timeline</option>
                {GRADUATION_TIMELINE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <svg
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                aria-hidden="true"
              >
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          <div>
            <p className={labelClassName}>Main concerns</p>
            <div className="grid grid-cols-1 gap-2 md-900:grid-cols-2">
              {MAIN_CONCERN_OPTIONS.map((option) => {
                const checked = selectedConcerns.includes(option.value);
                return (
                  <label
                    key={option.value}
                    className={[
                      "flex cursor-pointer items-center gap-3 rounded-[var(--radius-sm)] border px-3 py-2",
                      checked
                        ? "border-[var(--accent)]/30 bg-[var(--accent)]/10"
                        : "border-[var(--border)] bg-white",
                    ].join(" ")}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleConcern(option.value)}
                      className="h-4 w-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
                    />
                    <span className="text-sm text-[var(--text)]">{option.label}</span>
                  </label>
                );
              })}
            </div>

            {otherSelected && (
              <input
                id="intake-other-concern"
                type="text"
                value={otherConcern}
                onChange={(e) => setOtherConcern(e.target.value)}
                placeholder="Tell us more..."
                className={`${inputClassName} mt-2`}
              />
            )}
          </div>
        </div>

        {error && (
          <p className="mt-3 font-primary text-xs text-[var(--destructive)]">{error}</p>
        )}

        {successMessage && (
          <p className="mt-3 font-primary text-xs text-emerald-600">{successMessage}</p>
        )}

        <div className="mt-4 flex justify-end">
          <Button size="sm" onClick={handleSaveClick} loading={isPending} disabled={!isDirty || isPending}>
            Save changes
          </Button>
        </div>
      </Card>

      {showRecalculatePrompt && (
        <div className="mt-4 rounded-[var(--radius-md)] border border-[var(--accent)]/20 bg-[var(--accent)]/5 p-4">
          <p className="mb-1 text-sm font-medium text-[var(--text)]">
            Profile updated.
          </p>
          <p className="mb-3 text-sm text-[var(--text-muted)]">
            Your task due dates are still based on your previous arrival date. Would you like to
            recalculate them to match your new date?
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleRecalculate}
              disabled={isRecalcPending}
              className="rounded-[var(--radius-sm)] bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
            >
              {isRecalcPending ? "Updating…" : "Recalculate due dates"}
            </button>
            <button
              onClick={() => setShowRecalculatePrompt(false)}
              disabled={isRecalcPending}
              className="rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] px-3 py-1.5 text-xs text-[var(--text-muted)] disabled:opacity-50"
            >
              Keep existing dates
            </button>
          </div>
          {recalcError && (
            <p className="mt-2 text-xs text-[var(--destructive)]">{recalcError}</p>
          )}
        </div>
      )}
    </section>
  );
}
