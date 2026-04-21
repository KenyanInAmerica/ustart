// Onboarding progress card — Feature 3.
// Pure Server Component: receives computed booleans from the parent page and
// renders four step tiles with done/pending visual states. No data fetching.
import { Card } from "@/components/ui/Card";

interface StartHereProps {
  hasMembership: boolean;
  // True once the user has visited any content page — tracked via first_content_visit_at.
  // Decoupled from hasMembership so users who purchase but haven't clicked through stay on step 3.
  hasAccessedContent: boolean;
  hasAgreedToCommunity: boolean;
  role: string;
}

interface Step {
  number: string;
  label: string;
  done: boolean;
}

// Filled white circle + dark checkmark — used when a step is complete.
function CheckDone() {
  return (
    <div
      className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#3083DC]/10 text-[#3083DC]"
      aria-label="Step complete"
    >
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" aria-hidden="true">
        <path
          d="M1.5 5L4 7.5L8.5 2.5"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

// Dim outline circle — used when a step is still pending.
function CheckPending() {
  return (
    <div
      className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-[var(--border-md)] bg-white"
      aria-label="Step pending"
    >
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
        <path
          d="M1.5 5L4 7.5L8.5 2.5"
          stroke="rgba(28, 43, 58, 0.24)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function StartHere({ hasMembership, hasAccessedContent, hasAgreedToCommunity, role }: StartHereProps) {
  // Parent accounts don't have their own onboarding steps — skip the card entirely.
  if (role === "parent") return null;
  // All steps complete — collapse the card so the content sections shift up naturally.
  if (hasMembership && hasAccessedContent && hasAgreedToCommunity) return null;

  const steps: Step[] = [
    // Step 1 is always done — reaching the dashboard proves account creation.
    { number: "01", label: "Create your account", done: true },
    { number: "02", label: "Choose your plan", done: hasMembership },
    // Step 3 tracks whether the user has navigated to a content page (first_content_visit_at).
    // Intentionally independent of hasMembership — purchase alone doesn't satisfy this step.
    { number: "03", label: "Access your content", done: hasAccessedContent },
    { number: "04", label: "Join the community", done: hasAgreedToCommunity },
  ];

  const completedCount = steps.filter((step) => step.done).length;
  const progressClassName =
    completedCount === 4
      ? "w-full"
      : completedCount === 3
      ? "w-3/4"
      : completedCount === 2
      ? "w-1/2"
      : "w-1/4";

  return (
    <Card className="relative mb-8 overflow-hidden" padding="lg">
      <div className="mb-6 h-2 rounded-full bg-[var(--bg-subtle)]">
        <div
          className={`h-full rounded-full bg-[#3083DC] transition-[width] duration-300 ${progressClassName}`}
          aria-hidden="true"
        />
      </div>

      {/* Eyebrow */}
      <p className="mb-3 font-primary text-xs font-semibold uppercase tracking-widest text-[var(--text)]">
        Start Here
      </p>

      {/* Title */}
      <h2 className="mb-1 font-primary text-lg font-bold text-[var(--text)]">
        Get set up in 4 steps
      </h2>

      {/* Description */}
      <p className="mb-6 font-primary text-sm text-[var(--text-muted)]">
        Complete each step to unlock your full UStart experience.
      </p>
      <p className="mb-4 font-primary text-sm font-semibold text-[#3083DC]">
        {Math.round((completedCount / steps.length) * 100)}% complete
      </p>

      {/* Step tiles — flex row, each tile takes equal width */}
      <div className="flex gap-2">
        {steps.map((step) => (
          <div
            key={step.number}
            className="flex-1 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-card-hover)] p-4"
          >
            <div className="flex items-start justify-between mb-3">
              {/* Step number dims once done to keep focus on the label */}
              <span
                className={`font-primary text-[11px] font-bold ${
                  step.done ? "text-[#3083DC]" : "text-[var(--text-mid)]"
                }`}
              >
                {step.number}
              </span>
              {step.done ? <CheckDone /> : <CheckPending />}
            </div>
            <p
              className={`font-primary text-xs leading-snug ${
                step.done ? "text-[#3083DC]" : "text-[var(--text)]"
              }`}
            >
              {step.label}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}
