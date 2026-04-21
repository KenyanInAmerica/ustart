// Admin-specific types used by the admin portal pages, data layer, and server actions.
// Separate from types/index.ts which is reserved for Stripe webhook and dashboard types.

// A user record as returned by the user management table.
// Core columns come from the user_access view; is_admin is merged from profiles.
export interface AdminUser {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  university_name: string | null;
  membership_tier: string | null;
  membership_purchased_at: string | null;
  has_explore: boolean;
  has_concierge: boolean;
  has_parent_seat: boolean;
  // Merged from profiles table — used to hide the delete button for admin accounts.
  is_admin: boolean;
  // false when the account has been soft-deleted via softDeleteUser.
  is_active: boolean;
}

// A content item row from the content_items table.
export interface ContentItem {
  id: string;
  title: string;
  description: string;
  tier: "lite" | "explore" | "concierge" | "parent_pack";
  file_path: string;
  file_name: string;
  uploaded_by: string | null;
  // When true, this item was uploaded for a specific user and must not appear
  // in tier-based content feeds. Only visible via user_content_items assignment.
  is_individual_only: boolean;
  created_at: string;
  updated_at: string;
}

// An individual user–content assignment from user_content_items.
export interface UserContentItem {
  id: string;
  user_id: string;
  content_item_id: string;
  assigned_by: string | null;
  created_at: string;
  // Joined content item data when fetching user assignments.
  content_item?: Pick<ContentItem, "id" | "title" | "tier" | "file_name">;
}

// A parent invitation row enriched with student name/email for display.
export interface ParentInvitationRow {
  id: string;
  student_id: string;
  parent_email: string;
  status: "pending" | "accepted" | "cancelled";
  invited_at: string;
  accepted_at: string | null;
  // Joined from user_access — may be null if the student row is missing.
  student_email: string | null;
  student_first_name: string | null;
  student_last_name: string | null;
}

// An admin record — users whose profiles.is_admin is true.
export interface AdminRecord {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

// Summary stat card data for the admin overview page.
export interface AdminStats {
  totalUsers: number;
  totalStudents: number;
  totalParents: number;
  membersByTier: Record<string, number>;
  activeExplore: number;
  activeConcierge: number;
  activeParentPack: number;
  communityMembers: number;
  pendingInvitations: number;
  inactiveAccounts: number;
}

// A community member row (users who have agreed to community rules).
export interface CommunityMember {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  university_name: string | null;
  // ISO timestamp from community_agreements.created_at
  agreed_at: string;
}

// A recent user signup for the overview activity table.
export interface RecentSignup {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: "student" | "parent";
  university_name: string | null;
  created_at: string;
}
