// Data fetching for the admin audit log page.
// All queries run server-side using the service client.

import { createServiceClient } from "@/lib/supabase/service";
import { AuditAction } from "@/lib/audit/actions";

export interface AuditLogRow {
  id: string;
  created_at: string;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  target_id: string | null;
  target_email: string | null;
  payload: Record<string, unknown> | null;
  payload_text: string | null; // generated column — payload cast to text for ILIKE search
}

export interface AuditLogFilters {
  actions?: string[];
  user?: string;
  search?: string;
  from?: string;
  to?: string;
  role?: "all" | "admin" | "user";
}

export const PAGE_SIZE = 50;

// Each action entry has a machine value (sent to Supabase) and a human label (shown in the UI).
export interface ActionEntry {
  value: string;
  label: string;
}

// Grouped action definitions for the filter dropdown — ordered to match the spec.
export const ACTION_GROUPS: { label: string; actions: ActionEntry[] }[] = [
  {
    label: "Auth",
    actions: [
      { value: AuditAction.AUTH_SIGN_IN, label: "Sign In" },
      { value: AuditAction.AUTH_SIGN_OUT, label: "Sign Out" },
      { value: AuditAction.AUTH_SIGN_IN_BLOCKED, label: "Sign In Blocked" },
    ],
  },
  {
    label: "Profile",
    actions: [{ value: AuditAction.PROFILE_UPDATED, label: "Profile Updated" }],
  },
  {
    label: "Membership & Purchases",
    actions: [
      { value: AuditAction.MEMBERSHIP_PURCHASED, label: "Membership Purchased" },
      { value: AuditAction.MEMBERSHIP_UPGRADED, label: "Membership Upgraded" },
      { value: AuditAction.ADDON_SUBSCRIBED, label: "Add-on Subscribed" },
      { value: AuditAction.ADDON_CANCELLED, label: "Add-on Cancelled" },
      { value: AuditAction.PARENT_PACK_PURCHASED, label: "Parent Pack Purchased" },
    ],
  },
  {
    label: "Parent",
    actions: [
      { value: AuditAction.PARENT_INVITATION_SENT, label: "Invitation Sent" },
      { value: AuditAction.PARENT_INVITATION_RESENT, label: "Invitation Resent" },
      { value: AuditAction.PARENT_INVITATION_CANCELLED, label: "Invitation Cancelled" },
      { value: AuditAction.PARENT_INVITATION_ACCEPTED, label: "Invitation Accepted" },
      { value: AuditAction.PARENT_UNLINKED, label: "Parent Unlinked" },
    ],
  },
  {
    label: "Community",
    actions: [{ value: AuditAction.COMMUNITY_RULES_ACCEPTED, label: "Rules Accepted" }],
  },
  {
    label: "Admin — Users",
    actions: [
      { value: AuditAction.ADMIN_USER_SOFT_DELETED, label: "User Soft Deleted" },
      { value: AuditAction.ADMIN_USER_HARD_DELETED, label: "User Hard Deleted" },
      { value: AuditAction.ADMIN_USER_REACTIVATED, label: "User Reactivated" },
    ],
  },
  {
    label: "Admin — Access",
    actions: [
      { value: AuditAction.ADMIN_ACCESS_GRANTED, label: "Access Granted" },
      { value: AuditAction.ADMIN_ACCESS_REVOKED, label: "Access Revoked" },
    ],
  },
  {
    label: "Admin — Content",
    actions: [
      { value: AuditAction.ADMIN_CONTENT_UPLOADED, label: "Content Uploaded" },
      { value: AuditAction.ADMIN_CONTENT_DELETED, label: "Content Deleted" },
      { value: AuditAction.ADMIN_CONTENT_ASSIGNED, label: "Content Assigned" },
    ],
  },
  {
    label: "Admin — Pricing",
    actions: [{ value: AuditAction.ADMIN_PRICING_UPDATED, label: "Pricing Updated" }],
  },
  {
    label: "Admin — Settings",
    actions: [{ value: AuditAction.ADMIN_SETTINGS_UPDATED, label: "Settings Updated" }],
  },
  {
    label: "Admin — Parent Management",
    actions: [
      { value: AuditAction.ADMIN_PARENT_MANUALLY_LINKED, label: "Parent Manually Linked" },
      { value: AuditAction.ADMIN_PARENT_INVITATION_CANCELLED, label: "Invitation Cancelled" },
    ],
  },
];

export async function fetchAuditLog(
  page: number,
  filters: AuditLogFilters
): Promise<{ rows: AuditLogRow[]; total: number }> {
  const service = createServiceClient();
  const offset = (page - 1) * PAGE_SIZE;

  let query = service
    .from("audit_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (filters.actions && filters.actions.length > 0) {
    query = query.in("action", filters.actions);
  }

  if (filters.user) {
    // Targeted email match on actor or target email.
    query = query.or(
      `actor_email.ilike.%${filters.user}%,target_email.ilike.%${filters.user}%`
    );
  }

  if (filters.search) {
    // payload_text is a stored generated column (payload::text) with a GIN trigram
    // index — allows ILIKE substring search on payload without a type cast in the
    // filter string, which PostgREST's .or() parser does not support.
    query = query.or(
      `actor_email.ilike.%${filters.search}%,target_email.ilike.%${filters.search}%,action.ilike.%${filters.search}%,payload_text.ilike.%${filters.search}%`
    );
  }

  if (filters.from) {
    query = query.gte("created_at", filters.from);
  }

  if (filters.to) {
    // End of the selected day — include events up to midnight.
    query = query.lte("created_at", `${filters.to}T23:59:59.999Z`);
  }

  if (filters.role === "admin") {
    query = query.like("action", "admin.%");
  } else if (filters.role === "user") {
    query = query.not("action", "like", "admin.%");
  }

  const { data, count, error } = await query;

  if (error) {
    console.error("[auditLog] fetch error:", error.message);
    return { rows: [], total: 0 };
  }

  return {
    rows: (data ?? []) as AuditLogRow[],
    total: count ?? 0,
  };
}
