// Server-side data-fetching functions for the admin portal.
// All queries use the service client to bypass RLS — these functions must only
// be called from Server Components, Server Actions, or Route Handlers.
// Wrapped in React.cache where the same data is needed by multiple components
// in a single request.

import { cache } from "react";
import { createServiceClient } from "@/lib/supabase/service";
import type {
  AdminUser,
  AdminStats,
  CommunityMember,
  ContentItem,
  UserContentItem,
  ParentInvitationRow,
  AdminRecord,
  RecentSignup,
} from "@/types/admin";

const PAGE_SIZE = 25;

type RawRow = {
  id: string;
  user_id: string;
  content_item_id: string;
  assigned_by: string | null;
  created_at: string;
  content_items: Pick<ContentItem, "id" | "title" | "tier" | "file_name"> | null;
};

// ── Overview ──────────────────────────────────────────────────────────────────

// Aggregates summary stats for the admin overview page.
// A single pass over user_access is enough to compute most counters.
export const fetchAdminStats = cache(async (): Promise<AdminStats> => {
  const service = createServiceClient();

  const [{ data: usersData }, { data: invitationsData }] = await Promise.all([
    service
      .from("user_access")
      .select("membership_tier, has_parent_seat, has_agreed_to_community"),
    service
      .from("parent_invitations")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  const users = (usersData ?? []) as {
    membership_tier: string | null;
    has_parent_seat: boolean | null;
    has_agreed_to_community: boolean | null;
  }[];

  const membersByTier: Record<string, number> = {};
  let activeExplore = 0;
  let activeConcierge = 0;
  let activeParentPack = 0;
  let communityMembers = 0;

  for (const u of users) {
    if (u.membership_tier) {
      membersByTier[u.membership_tier] =
        (membersByTier[u.membership_tier] ?? 0) + 1;
    }
    if (u.membership_tier === "explore" || u.membership_tier === "concierge") {
      activeExplore++;
    }
    if (u.membership_tier === "concierge") activeConcierge++;
    if (u.has_parent_seat) activeParentPack++;
    if (u.has_agreed_to_community) communityMembers++;
  }

  return {
    totalUsers: 0, // accurate totalUsers computed in fetchAdminOverview
    totalStudents: users.length,
    // fetchAdminStats is a cached helper; these are computed accurately in
    // fetchAdminOverview which is what the overview page actually calls.
    totalParents: 0,
    inactiveAccounts: 0,
    membersByTier,
    activeExplore,
    activeConcierge,
    activeParentPack,
    communityMembers,
    pendingInvitations: 0,
  };
});

// Fetches summary stats with accurate pending invitation count.
// Separated from fetchAdminStats because Supabase count queries return the count
// on the response object, not inside the data array.
// Wrapped in React.cache so AdminStatsSection and RecentSignupsSection share
// a single DB round-trip when both render in the same streaming request.
export const fetchAdminOverview = cache(async (): Promise<{
  stats: AdminStats;
  recentSignups: RecentSignup[];
}> => {
  const service = createServiceClient();

  const [
    { data: usersData },
    { count: pendingCount },
    { data: profileCounts },
  ] = await Promise.all([
    service
      .from("user_access")
      .select("membership_tier, has_parent_seat, has_agreed_to_community"),
    service
      .from("parent_invitations")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    // Single query across profiles covers role totals and inactive count.
    // Equivalent to:
    //   SELECT role, is_active FROM public.profiles;
    // then aggregated in JS below.
    service.from("profiles").select("role, is_active"),
  ]);

  const users = (usersData ?? []) as {
    membership_tier: string | null;
    has_parent_seat: boolean | null;
    has_agreed_to_community: boolean | null;
  }[];

  const membersByTier: Record<string, number> = {};
  let activeExplore = 0;
  let activeConcierge = 0;
  let activeParentPack = 0;
  let communityMembers = 0;

  for (const u of users) {
    if (u.membership_tier) {
      membersByTier[u.membership_tier] =
        (membersByTier[u.membership_tier] ?? 0) + 1;
    }
    if (u.membership_tier === "explore" || u.membership_tier === "concierge") {
      activeExplore++;
    }
    if (u.membership_tier === "concierge") activeConcierge++;
    if (u.has_parent_seat) activeParentPack++;
    if (u.has_agreed_to_community) communityMembers++;
  }

  const profiles = (profileCounts ?? []) as { role: string | null; is_active: boolean | null }[];
  const totalStudents = profiles.filter((p) => p.role === "student").length;
  const totalParents = profiles.filter((p) => p.role === "parent").length;
  // is_active defaults to true in the DB, so null is treated as active.
  const inactiveAccounts = profiles.filter((p) => p.is_active === false).length;

  const stats: AdminStats = {
    totalUsers: profiles.length,
    totalStudents,
    totalParents,
    membersByTier,
    activeExplore,
    activeConcierge,
    activeParentPack,
    communityMembers,
    pendingInvitations: pendingCount ?? 0,
    inactiveAccounts,
  };

  // Query profiles directly — equivalent to the raw SQL:
  //   SELECT p.* FROM auth.users u JOIN public.profiles p ON p.id = u.id
  //   ORDER BY u.created_at DESC LIMIT 10
  // profiles.created_at is set by the handle_new_user trigger at signup time
  // and covers all roles, so no intermediate auth.admin.listUsers join needed.
  const { data: recentData } = await service
    .from("profiles")
    .select("id, email, first_name, last_name, role, university_name, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  const recentSignups: RecentSignup[] = (
    (recentData ?? []) as {
      id: string;
      email: string;
      first_name: string | null;
      last_name: string | null;
      role: string | null;
      university_name: string | null;
      created_at: string;
    }[]
  ).map((p) => ({
    id: p.id,
    email: p.email,
    first_name: p.first_name,
    last_name: p.last_name,
    role: p.role === "parent" ? "parent" : "student",
    university_name: p.university_name,
    created_at: p.created_at,
  }));

  return { stats, recentSignups };
});

// ── User Management ───────────────────────────────────────────────────────────

// Fetches a paginated, optionally filtered list of users for the management table.
// Queries profiles as the base table (PostgREST cannot resolve FK relationships
// through views, so a profiles!inner join on user_access silently returns zero
// rows). Entitlement data is fetched in a second query against user_access and
// merged by id.
export async function fetchAdminUsers(
  page: number = 1,
  search: string = ""
): Promise<{ users: AdminUser[]; total: number }> {
  const service = createServiceClient();
  const offset = (page - 1) * PAGE_SIZE;

  let query = service
    .from("profiles")
    .select(
      "id, email, first_name, last_name, university_name, is_admin, is_active",
      { count: "exact" }
    )
    .order("email")
    .range(offset, offset + PAGE_SIZE - 1);

  if (search.trim()) {
    const term = `%${search.trim()}%`;
    query = query.or(
      `email.ilike.${term},first_name.ilike.${term},last_name.ilike.${term}`
    );
  }

  const { data: profileData, count } = await query;

  const profiles = (profileData ?? []) as {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    university_name: string | null;
    is_admin: boolean | null;
    is_active: boolean | null;
  }[];

  if (profiles.length === 0) return { users: [], total: count ?? 0 };

  // Enrich with entitlement data from user_access.
  const ids = profiles.map((p) => p.id);
  const { data: accessData } = await service
    .from("user_access")
    .select(
      "id, membership_tier, membership_purchased_at, has_parent_seat"
    )
    .in("id", ids);

  const accessMap = new Map(
    (
      (accessData ?? []) as {
        id: string;
        membership_tier: string | null;
        membership_purchased_at: string | null;
        has_parent_seat: boolean | null;
      }[]
    ).map((a) => [a.id, a])
  );

  return {
    users: profiles.map((p) => {
      const access = accessMap.get(p.id);
      return {
        id: p.id,
        email: p.email,
        first_name: p.first_name,
        last_name: p.last_name,
        university_name: p.university_name,
        membership_tier: access?.membership_tier ?? null,
        membership_purchased_at: access?.membership_purchased_at ?? null,
        has_explore:
          access?.membership_tier === "explore" ||
          access?.membership_tier === "concierge",
        has_concierge: access?.membership_tier === "concierge",
        has_parent_seat: access?.has_parent_seat ?? false,
        is_admin: p.is_admin ?? false,
        is_active: p.is_active ?? true,
      };
    }) as AdminUser[],
    total: count ?? 0,
  };
}

// Fetches the individually assigned content items for a single user.
// Supabase returns the join key as "content_items" (table name) — we map it
// to "content_item" (singular) to match the UserContentItem type definition.
export async function fetchUserAssignments(
  userId: string
): Promise<UserContentItem[]> {
  const service = createServiceClient();
  const { data } = await service
    .from("user_content_items")
    .select(
      "id, user_id, content_item_id, assigned_by, created_at, content_items(id, title, tier, file_name)"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return ((data ?? []) as unknown as RawRow[]).map((row) => ({
    id: row.id,
    user_id: row.user_id,
    content_item_id: row.content_item_id,
    assigned_by: row.assigned_by,
    created_at: row.created_at,
    content_item: row.content_items ?? undefined,
  }));
}

// ── Community Members ─────────────────────────────────────────────────────────

// Fetches all users who have agreed to community rules, sorted by date agreed.
export async function fetchCommunityMembers(): Promise<CommunityMember[]> {
  const service = createServiceClient();

  // community_agreements holds the agreed_at timestamp; profiles holds contact info.
  // Use profiles (not user_access) to match the underlying schema — user_access is a
  // view that may not reflect all rows visible via the service client join.
  const { data: agreementsData } = await service
    .from("community_agreements")
    .select("user_id, agreed_at")
    .order("agreed_at", { ascending: false });

  const agreements = (agreementsData ?? []) as {
    user_id: string;
    agreed_at: string;
  }[];

  if (agreements.length === 0) return [];

  const userIds = agreements.map((a) => a.user_id);
  const { data: usersData } = await service
    .from("profiles")
    .select("id, email, first_name, last_name, phone_number, university_name")
    .in("id", userIds);

  const userMap = new Map(
    (
      (usersData ?? []) as {
        id: string;
        email: string;
        first_name: string | null;
        last_name: string | null;
        phone_number: string | null;
        university_name: string | null;
      }[]
    ).map((u) => [u.id, u])
  );

  return agreements
    .map((a) => {
      const u = userMap.get(a.user_id);
      if (!u) return null;
      return {
        id: u.id,
        email: u.email,
        first_name: u.first_name,
        last_name: u.last_name,
        phone_number: u.phone_number,
        university_name: u.university_name,
        agreed_at: a.agreed_at,
      };
    })
    .filter((m): m is CommunityMember => m !== null);
}

// ── Parent Invitations ────────────────────────────────────────────────────────

// Fetches all parent invitations, optionally filtered by status.
// Enriches each row with the student's email and name from user_access.
export async function fetchParentInvitations(
  statusFilter?: "pending" | "accepted" | "cancelled"
): Promise<ParentInvitationRow[]> {
  const service = createServiceClient();

  let query = service
    .from("parent_invitations")
    .select("id, student_id, parent_email, status, invited_at, accepted_at")
    .order("invited_at", { ascending: false });

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  const { data } = await query;
  const rows = (data ?? []) as {
    id: string;
    student_id: string;
    parent_email: string;
    status: string;
    invited_at: string;
    accepted_at: string | null;
  }[];

  if (rows.length === 0) return [];

  const studentIds = Array.from(new Set(rows.map((r) => r.student_id)));
  const { data: studentData } = await service
    .from("user_access")
    .select("id, email, first_name, last_name")
    .in("id", studentIds);

  const studentMap = new Map(
    (
      (studentData ?? []) as {
        id: string;
        email: string;
        first_name: string | null;
        last_name: string | null;
      }[]
    ).map((s) => [s.id, s])
  );

  return rows.map((r) => {
    const s = studentMap.get(r.student_id);
    return {
      id: r.id,
      student_id: r.student_id,
      parent_email: r.parent_email,
      status: r.status as "pending" | "accepted" | "cancelled",
      invited_at: r.invited_at,
      accepted_at: r.accepted_at,
      student_email: s?.email ?? null,
      student_first_name: s?.first_name ?? null,
      student_last_name: s?.last_name ?? null,
    };
  });
}

// ── Content ───────────────────────────────────────────────────────────────────

// Fetches shared catalog content items, optionally filtered by tier.
// Excludes individually-assigned-only items so they never appear in tier
// feeds or the admin content library. Those items are only reachable via
// user_content_items assignments.
export async function fetchContentItems(
  tier?: ContentItem["tier"]
): Promise<ContentItem[]> {
  const service = createServiceClient();

  let query = service
    .from("content_items")
    .select("id, title, description, tier, file_path, file_name, uploaded_by, is_individual_only, created_at, updated_at")
    .eq("is_individual_only", false)
    .order("created_at", { ascending: false });

  if (tier) {
    query = query.eq("tier", tier);
  }

  const { data } = await query;
  return (data ?? []) as ContentItem[];
}

// ── Admins ────────────────────────────────────────────────────────────────────

// Fetches all users with is_admin = true from profiles, enriched with email/name.
export async function fetchAdmins(): Promise<AdminRecord[]> {
  const service = createServiceClient();

  const { data: profileData } = await service
    .from("profiles")
    .select("id")
    .eq("is_admin", true);

  const adminIds = ((profileData ?? []) as { id: string }[]).map((p) => p.id);
  if (adminIds.length === 0) return [];

  const { data: userData } = await service
    .from("user_access")
    .select("id, email, first_name, last_name")
    .in("id", adminIds);

  return ((userData ?? []) as AdminRecord[]);
}

// ── Settings ──────────────────────────────────────────────────────────────────

// Fetches the current WhatsApp invite link from the config table.
export async function fetchAdminWhatsappLink(): Promise<string> {
  const service = createServiceClient();
  const { data } = await service
    .from("config")
    .select("value")
    .eq("key", "whatsapp_invite_link")
    .single();
  const row = data as { value: string } | null;
  return row?.value ?? "";
}
