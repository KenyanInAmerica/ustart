// Onboarding progress card — Feature 3.
// Pure Server Component: receives computed booleans from the parent page and
// renders four step tiles with done/pending visual states. No data fetching.

interface StartHereProps {
  hasMembership: boolean;
  // True once the user has visited any content page — tracked via first_content_visit_at.
  // Decoupled from hasMembership so users who purchase but haven't clicked through stay on step 3.
  hasAccessedContent: boolean;
  hasAgreedToCommunity: boolean;
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
      className="w-5 h-5 rounded-full bg-white flex items-center justify-center flex-shrink-0"
      aria-label="Step complete"
    >
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
        <path
          d="M1.5 5L4 7.5L8.5 2.5"
          stroke="#05080F"
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
      className="w-5 h-5 rounded-full border border-white/30 flex items-center justify-center flex-shrink-0"
      aria-label="Step pending"
    >
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
        <path
          d="M1.5 5L4 7.5L8.5 2.5"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function StartHere({ hasMembership, hasAccessedContent, hasAgreedToCommunity }: StartHereProps) {
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

  return (
    <div className="bg-[#0C1220] border border-white/[0.12] rounded-2xl p-8 mb-8 relative overflow-hidden">
      {/* Top gradient accent line — replicates the ::before pseudo-element in the HTML reference */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      {/* Eyebrow */}
      <p className="font-syne text-[11px] font-bold tracking-[0.12em] uppercase text-white/[0.42] mb-3">
        Start Here
      </p>

      {/* Title */}
      <h2 className="font-syne text-lg font-bold text-white mb-1">
        Get set up in 4 steps
      </h2>

      {/* Description */}
      <p className="font-dm-sans text-sm text-white/45 mb-6">
        Complete each step to unlock your full UStart experience.
      </p>

      {/* Step tiles — flex row, each tile takes equal width */}
      <div className="flex gap-2">
        {steps.map((step) => (
          <div
            key={step.number}
            className="flex-1 bg-white/[0.03] border border-white/[0.07] rounded-xl p-4"
          >
            <div className="flex items-start justify-between mb-3">
              {/* Step number dims once done to keep focus on the label */}
              <span
                className={`font-syne text-[11px] font-bold ${
                  step.done ? "text-white/20" : "text-white/[0.42]"
                }`}
              >
                {step.number}
              </span>
              {step.done ? <CheckDone /> : <CheckPending />}
            </div>
            <p
              className={`font-dm-sans text-xs leading-snug ${
                step.done ? "text-white" : "text-white/[0.42]"
              }`}
            >
              {step.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
