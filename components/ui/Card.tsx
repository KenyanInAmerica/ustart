import type { HTMLAttributes, ReactNode } from "react";

type CardShadow = "sm" | "md" | "lg";
type CardPadding = "sm" | "md" | "lg";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  shadow?: CardShadow;
  padding?: CardPadding;
}

const shadowClassNames: Record<CardShadow, string> = {
  sm: "shadow-[var(--shadow-sm)]",
  md: "shadow-[var(--shadow-md)]",
  lg: "shadow-[var(--shadow-lg)]",
};

const paddingClassNames: Record<CardPadding, string> = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export function Card({
  children,
  className,
  shadow = "md",
  padding = "md",
  ...props
}: CardProps) {
  return (
    <div
      {...props}
      className={[
        "rounded-[var(--radius-lg)] bg-[var(--bg-card)]",
        shadowClassNames[shadow],
        paddingClassNames[padding],
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
