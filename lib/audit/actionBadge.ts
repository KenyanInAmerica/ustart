// Pure utility for mapping action strings to badge styles.
// Extracted from AuditLogFilters.tsx so it can be imported freely in both
// Server Components (page.tsx) and Client Components (AuditLogFilters.tsx)
// without crossing the "use client" boundary in an unexpected way.

const CATEGORY_COLORS: Record<string, string> = {
  admin: "bg-violet-500/15 text-violet-300 border-violet-500/20",
  auth: "bg-blue-500/15 text-blue-300 border-blue-500/20",
  parent: "bg-amber-500/15 text-amber-300 border-amber-500/20",
  membership: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
  community: "bg-sky-500/15 text-sky-300 border-sky-500/20",
  other: "bg-white/10 text-white/50 border-white/10",
};

export function actionCategory(action: string): string {
  if (action.startsWith("admin.")) return "admin";
  if (action.startsWith("auth.")) return "auth";
  if (action.startsWith("parent.")) return "parent";
  if (
    action.startsWith("membership.") ||
    action.startsWith("addon.") ||
    action.startsWith("parent_pack.")
  )
    return "membership";
  if (action.startsWith("community.")) return "community";
  return "other";
}

export function actionBadgeClass(action: string): string {
  return CATEGORY_COLORS[actionCategory(action)] ?? CATEGORY_COLORS.other;
}
