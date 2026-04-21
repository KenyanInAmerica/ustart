const CATEGORY_COLORS: Record<string, string> = {
  admin: "bg-[#E54B4B]/10 text-[#E54B4B] border-[#E54B4B]/20",
  auth: "bg-[#3083DC]/10 text-[#3083DC] border-[#3083DC]/20",
  parent: "bg-[#4ECBA5]/10 text-[#4ECBA5] border-[#4ECBA5]/20",
  membership: "bg-[#F5C842]/10 text-yellow-700 border-[#F5C842]/30",
  community: "bg-[#9B8EC4]/10 text-[#9B8EC4] border-[#9B8EC4]/20",
  profile: "bg-[#F5C842]/10 text-yellow-700 border-[#F5C842]/30",
  other: "bg-[var(--bg-subtle)] text-[var(--text-muted)] border-[var(--border)]",
};

export function actionCategory(action: string): string {
  if (action.startsWith("admin.")) return "admin";
  if (action.startsWith("auth.")) return "auth";
  if (action.startsWith("profile.")) return "profile";
  if (action.startsWith("parent.")) return "parent";
  if (
    action.startsWith("membership.") ||
    action.startsWith("addon.") ||
    action.startsWith("parent_pack.")
  ) {
    return "membership";
  }
  if (action.startsWith("community.")) return "community";
  return "other";
}

export function actionBadgeClass(action: string): string {
  return CATEGORY_COLORS[actionCategory(action)] ?? CATEGORY_COLORS.other;
}
