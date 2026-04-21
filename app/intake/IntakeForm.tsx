"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { submitIntake } from "@/lib/actions/intake";
import type { IntakeFormData } from "@/lib/types/intake";

type FieldErrors = Partial<Record<keyof IntakeFormData, string>>;

type ConcernOption = {
  key: string;
  label: string;
};

const concernOptions: ConcernOption[] = [
  { key: "banking_credit", label: "Banking & Credit" },
  { key: "ssn", label: "Social Security Number (SSN)" },
  { key: "housing", label: "Housing & Accommodation" },
  { key: "transportation", label: "Transportation" },
  { key: "health_insurance", label: "Health Insurance" },
  { key: "tax_finance", label: "Tax & Finance" },
  { key: "campus_life", label: "Campus Life" },
  { key: "community_social", label: "Community & Social" },
  { key: "other", label: "Other" },
];

const MIN_PLAN_BUILD_MS = 2500;

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function isValidDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function baseInputClassName(hasError: boolean): string {
  return [
    "w-full rounded-[var(--radius-sm)] border bg-[var(--bg-subtle)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none",
    hasError ? "border-[var(--destructive)]" : "border-[var(--border)]",
  ].join(" ");
}

export function IntakeForm() {
  const router = useRouter();
  const redirectTimeoutRef = useRef<number | null>(null);
  const [formData, setFormData] = useState<IntakeFormData>({
    school: "",
    city: "",
    arrival_date: "",
    graduation_date: "",
    main_concerns: [],
    other_concern: "",
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBuildingPlan, setIsBuildingPlan] = useState(false);
  const minGraduationDate = useMemo(() => todayIsoDate(), []);
  const otherSelected = formData.main_concerns.includes("other");

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current !== null) {
        window.clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  function updateField<K extends keyof IntakeFormData>(key: K, value: IntakeFormData[K]) {
    setFormData((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
    setGeneralError(null);
  }

  function toggleConcern(concernKey: string) {
    setFormData((current) => {
      const exists = current.main_concerns.includes(concernKey);
      const nextConcerns = exists
        ? current.main_concerns.filter((key) => key !== concernKey)
        : [...current.main_concerns, concernKey];

      return {
        ...current,
        main_concerns: nextConcerns,
        other_concern: concernKey === "other" && exists ? "" : current.other_concern,
      };
    });

    setFieldErrors((current) => ({
      ...current,
      main_concerns: undefined,
      other_concern: concernKey === "other" ? undefined : current.other_concern,
    }));
    setGeneralError(null);
  }

  function validate(): FieldErrors {
    const nextErrors: FieldErrors = {};
    const trimmedSchool = formData.school.trim();
    const trimmedCity = formData.city.trim();
    const trimmedOtherConcern = (formData.other_concern ?? "").trim();

    if (!trimmedSchool) {
      nextErrors.school = "Please enter your school or university.";
    }

    if (!trimmedCity) {
      nextErrors.city = "Please enter your city.";
    }

    if (!isValidDateOnly(formData.arrival_date)) {
      nextErrors.arrival_date = "Please enter a valid arrival date.";
    }

    if (!isValidDateOnly(formData.graduation_date)) {
      nextErrors.graduation_date = "Please enter a valid graduation date.";
    } else if (
      isValidDateOnly(formData.arrival_date) &&
      formData.graduation_date <= formData.arrival_date
    ) {
      nextErrors.graduation_date = "Graduation date must be after arrival date.";
    }

    if (formData.main_concerns.length === 0) {
      nextErrors.main_concerns = "Select at least one concern.";
    }

    if (otherSelected && !trimmedOtherConcern) {
      nextErrors.other_concern = "Tell us more about your other concern.";
    }

    return nextErrors;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    setGeneralError(null);
    setIsBuildingPlan(true);

    const buildStartTime = Date.now();

    const result = await submitIntake({
      ...formData,
      school: formData.school.trim(),
      city: formData.city.trim(),
      other_concern: otherSelected ? formData.other_concern?.trim() ?? "" : "",
    });

    setIsSubmitting(false);

    if (!result.success) {
      setIsBuildingPlan(false);
      setGeneralError(result.error);
      return;
    }

    // Keep a minimum dwell time for the build state, but don't add extra delay
    // once a future real plan-building step takes longer than that.
    const remainingDelay = Math.max(
      0,
      MIN_PLAN_BUILD_MS - (Date.now() - buildStartTime)
    );

    redirectTimeoutRef.current = window.setTimeout(() => {
      router.push("/dashboard");
    }, remainingDelay);
  }

  if (isBuildingPlan) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">
          <svg
            className="h-7 w-7 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="12"
              cy="12"
              r="9"
              stroke="currentColor"
              strokeOpacity="0.25"
              strokeWidth="3"
            />
            <path
              d="M21 12a9 9 0 0 0-9-9"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <h2 className="mt-6 font-primary text-2xl font-bold text-[var(--text)]">
          Building your plan...
        </h2>
        <p className="mt-2 max-w-sm text-sm text-[var(--text-muted)]">
          We&apos;re setting up your dashboard and tailoring the first steps to
          your journey. This usually takes a few seconds.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-primary text-2xl font-bold text-[var(--text)]">
          Let&apos;s personalise your UStart experience
        </h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Tell us a bit about your move so we can tailor what you see first.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div>
          <label
            htmlFor="school"
            className="mb-2 block text-sm font-medium text-[var(--text)]"
          >
            Where are you studying?
          </label>
          <input
            id="school"
            type="text"
            required
            value={formData.school}
            onChange={(event) => updateField("school", event.target.value)}
            placeholder="e.g. University of Michigan"
            className={baseInputClassName(Boolean(fieldErrors.school))}
          />
          {fieldErrors.school && (
            <p className="mt-2 text-xs text-[var(--destructive)]" role="alert">
              {fieldErrors.school}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="city"
            className="mb-2 block text-sm font-medium text-[var(--text)]"
          >
            Which city?
          </label>
          <input
            id="city"
            type="text"
            required
            value={formData.city}
            onChange={(event) => updateField("city", event.target.value)}
            placeholder="e.g. Ann Arbor, MI"
            className={baseInputClassName(Boolean(fieldErrors.city))}
          />
          {fieldErrors.city && (
            <p className="mt-2 text-xs text-[var(--destructive)]" role="alert">
              {fieldErrors.city}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="arrival_date"
            className="mb-2 block text-sm font-medium text-[var(--text)]"
          >
            When did you arrive, or when will you arrive in the US?
          </label>
          <input
            id="arrival_date"
            type="date"
            required
            value={formData.arrival_date}
            onChange={(event) => updateField("arrival_date", event.target.value)}
            className={baseInputClassName(Boolean(fieldErrors.arrival_date))}
          />
          {fieldErrors.arrival_date && (
            <p className="mt-2 text-xs text-[var(--destructive)]" role="alert">
              {fieldErrors.arrival_date}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="graduation_date"
            className="mb-2 block text-sm font-medium text-[var(--text)]"
          >
            When do you graduate?
          </label>
          <input
            id="graduation_date"
            type="date"
            required
            min={formData.arrival_date || minGraduationDate}
            value={formData.graduation_date}
            onChange={(event) => updateField("graduation_date", event.target.value)}
            className={baseInputClassName(Boolean(fieldErrors.graduation_date))}
          />
          {fieldErrors.graduation_date && (
            <p className="mt-2 text-xs text-[var(--destructive)]" role="alert">
              {fieldErrors.graduation_date}
            </p>
          )}
        </div>

        <div>
          <p className="mb-2 block text-sm font-medium text-[var(--text)]">
            What are you most concerned about? (Select all that apply)
          </p>
          <div className="grid grid-cols-1 gap-3 md-900:grid-cols-2">
            {concernOptions.map((option) => {
              const checked = formData.main_concerns.includes(option.key);

              return (
                <label
                  key={option.key}
                  className={[
                    "flex cursor-pointer items-center gap-3 rounded-[var(--radius-sm)] border px-3 py-2.5",
                    checked
                      ? "border-[var(--accent)]/30 bg-[var(--accent)]/10"
                      : "border-[var(--border)] bg-white",
                  ].join(" ")}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleConcern(option.key)}
                    className="h-4 w-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)]"
                  />
                  <span className="text-sm text-[var(--text)]">{option.label}</span>
                </label>
              );
            })}
          </div>
          {fieldErrors.main_concerns && (
            <p className="mt-2 text-xs text-[var(--destructive)]" role="alert">
              {fieldErrors.main_concerns}
            </p>
          )}
        </div>

        {otherSelected && (
          <div>
            <input
              id="other_concern"
              type="text"
              required
              value={formData.other_concern ?? ""}
              onChange={(event) => updateField("other_concern", event.target.value)}
              placeholder="Tell us more..."
              className={baseInputClassName(Boolean(fieldErrors.other_concern))}
            />
            {fieldErrors.other_concern && (
              <p className="mt-2 text-xs text-[var(--destructive)]" role="alert">
                {fieldErrors.other_concern}
              </p>
            )}
          </div>
        )}

        {generalError && (
          <p className="text-xs text-[var(--destructive)]" role="alert">
            {generalError}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  stroke="currentColor"
                  strokeOpacity="0.25"
                  strokeWidth="3"
                />
                <path
                  d="M21 12a9 9 0 0 0-9-9"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
              <span>Building your plan...</span>
            </>
          ) : (
            "Build my plan →"
          )}
        </Button>
      </form>
    </div>
  );
}
