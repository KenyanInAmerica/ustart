// Typed constants for every auditable action in the system.
// Use these instead of raw strings to prevent typos and enable refactoring.

export const AuditAction = {
  // Auth
  AUTH_SIGN_IN: "auth.sign_in",
  AUTH_SIGN_OUT: "auth.sign_out",
  AUTH_SIGN_IN_BLOCKED: "auth.sign_in_blocked",

  // Profile
  PROFILE_UPDATED: "profile.updated",

  // Membership & Purchases
  MEMBERSHIP_PURCHASED: "membership.purchased",
  MEMBERSHIP_UPGRADED: "membership.upgraded",
  ADDON_SUBSCRIBED: "addon.subscribed",
  ADDON_CANCELLED: "addon.cancelled",
  PARENT_PACK_PURCHASED: "parent_pack.purchased",

  // Parent Flow
  PARENT_INVITATION_SENT: "parent.invitation_sent",
  PARENT_INVITATION_RESENT: "parent.invitation_resent",
  PARENT_INVITATION_CANCELLED: "parent.invitation_cancelled",
  PARENT_INVITATION_ACCEPTED: "parent.invitation_accepted",
  PARENT_SHARING_UPDATED: "parent.sharing_updated",
  PARENT_UNLINKED: "parent.unlinked",

  // Community
  COMMUNITY_RULES_ACCEPTED: "community.rules_accepted",

  // Admin — User Management
  ADMIN_USER_SOFT_DELETED: "admin.user.soft_deleted",
  ADMIN_USER_HARD_DELETED: "admin.user.hard_deleted",
  ADMIN_USER_REACTIVATED: "admin.user.reactivated",

  // Admin — Access Management
  ADMIN_ACCESS_GRANTED: "admin.access.granted",
  ADMIN_ACCESS_REVOKED: "admin.access.revoked",

  // Admin — Content
  ADMIN_CONTENT_UPLOADED: "admin.content.uploaded",
  ADMIN_CONTENT_DELETED: "admin.content.deleted",
  ADMIN_CONTENT_ASSIGNED: "admin.content.assigned",

  // Admin — Plan Templates
  ADMIN_PLAN_TEMPLATE_CREATED: "admin.plan_template.created",
  ADMIN_PLAN_TEMPLATE_UPDATED: "admin.plan_template.updated",
  ADMIN_PLAN_TEMPLATE_DELETED: "admin.plan_template.deleted",
  ADMIN_PLAN_TEMPLATE_REORDERED: "admin.plan_template.reordered",
  ADMIN_PLAN_REINSTANTIATED: "admin.plan.reinstantiated",

  // Admin — Pricing
  ADMIN_PRICING_UPDATED: "admin.pricing.updated",

  // Admin — Settings
  ADMIN_SETTINGS_UPDATED: "admin.settings.updated",

  // Admin — Parent Management
  ADMIN_PARENT_MANUALLY_LINKED: "admin.parent.manually_linked",
  ADMIN_PARENT_INVITATION_CANCELLED: "admin.parent.invitation_cancelled",
} as const;

export type AuditActionType = (typeof AuditAction)[keyof typeof AuditAction];
