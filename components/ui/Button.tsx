import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantClassNames: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]",
  secondary:
    "border border-[var(--border-md)] bg-white text-[var(--text)] hover:bg-[var(--bg-subtle)]",
  ghost:
    "bg-transparent text-[var(--text-mid)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text)]",
  destructive:
    "bg-[var(--destructive)] text-white hover:bg-[var(--destructive-hover)]",
};

const sizeClassNames: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3.5 py-2 text-sm",
  md: "min-h-10 px-4 py-2.5 text-sm",
  lg: "min-h-12 px-5 py-3 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] font-primary font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60",
        variantClassNames[variant],
        sizeClassNames[size],
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {loading ? (
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
          <span>Loading...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
