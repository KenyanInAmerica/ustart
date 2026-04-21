// Data-fetching layer for the dashboard shell and page components.
// Both exported functions are memoised with React.cache so that the layout
// and any page calling them share a single Supabase round-trip per request.

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { DashboardAccess } from "@/types";

function deriveMembershipAccess(
  membershipTier: string | null,
  membershipRank: number
): Pick<DashboardAccess, "hasExplore" | "hasConcierge"> {
  return {
    hasExplore:
      membershipTier === "explore" ||
      membershipTier === "concierge" ||
      membershipRank >= 2,
    hasConcierge:
      membershipTier === "concierge" || membershipRank >= 3,
  };
}

// React.cache deduplicates this call within a single render pass — both the
// layout (sidebar/drawer) and the page (content cards, StartHere) can call
// fetchDashboardAccess() and only one Supabase round-trip occurs per request.
export const fetchDashboardAccess = cache(async (): Promise<DashboardAccess> => {
  const supabase = createClient();

  // Fetch the user ID upfront — needed for explicit-filter queries on tables
  // where RLS alone isn't sufficient to disambiguate roles (profiles, parent_invitations).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      membershipRank: 0,
      membershipTier: null,
      membershipPurchasedAt: null,
      hasMembership: false,
      hasParentSeat: false,
      hasExplore: false,
      hasConcierge: false,
      hasAgreedToCommunity: false,
      hasAccessedContent: false,
      phoneNumber: null,
      invitedParentEmail: null,
      parentInvitationStatus: null,
      parentInvitationAcceptedAt: null,
      role: "student",
    };
  }

  // Three parallel queries — independent data sources:
  // 1. user_access: core entitlement data. SELECT list is identical to Feature 6 —
  //    no new columns added here because invited_parent_email / role / student_id
  //    live in separate tables, not in this view.
  // 2. profiles: role + student linkage.
  // 3. parent_invitations: the student's active (pending/accepted) invitation, if any.
  const [
    { data: entitlementData },
    { data: profileData },
    { data: invitationData },
  ] = await Promise.all([
    supabase
      .from("user_access")
      .select(
        "membership_rank, membership_tier, membership_purchased_at, has_membership, has_parent_seat, has_agreed_to_community, first_content_visit_at, phone_number"
      )
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("role, student_id")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("parent_invitations")
      .select("parent_email, status, accepted_at")
      .eq("student_id", user.id)
      .in("status", ["pending", "accepted"])
      .maybeSingle(),
  ]);

  const raw = entitlementData as {
    membership_rank: number | null;
    membership_tier: string | null;
    membership_purchased_at: string | null;
    has_membership: boolean | null;
    has_parent_seat: boolean | null;
    has_agreed_to_community: boolean | null;
    first_content_visit_at: string | null;
    phone_number: string | null;
  } | null;

  const profile = profileData as {
    role: string | null;
    student_id: string | null;
  } | null;

  const invitation = invitationData as {
    parent_email: string | null;
    status: string | null;
    accepted_at: string | null;
  } | null;

  const role = (profile?.role ?? "student") as "student" | "parent";

  // Start with the user's own entitlements — will be overridden for parent accounts.
  let membershipRank = raw?.membership_rank ?? 0;
  let membershipTier = raw?.membership_tier ?? null;
  let hasParentSeat = raw?.has_parent_seat === true;
  let { hasExplore, hasConcierge } = deriveMembershipAccess(
    membershipTier,
    membershipRank
  );

  // Parents don't have their own purchases — use the linked student's entitlements
  // to determine which content sections they can access. Service role bypasses RLS
  // so we can query another user's row in the view.
  if (role === "parent" && profile?.student_id) {
    // Parents have no memberships row of their own. Their Stripe purchases are
    // recorded against the student's customer_id, so all entitlement data lives
    // on the student's user_access row. We fetch the student's row here and
    // override the parent's local entitlement variables so the rest of this
    // function treats the parent as having the same access as their student.
    const serviceClient = createServiceClient();
    const { data: studentData } = await serviceClient
      .from("user_access")
      .select("membership_rank, membership_tier, has_parent_seat")
      .eq("id", profile.student_id)
      .maybeSingle();

    const student = studentData as {
      membership_rank: number | null;
      membership_tier: string | null;
      has_parent_seat: boolean | null;
    } | null;

    if (student) {
      membershipRank = student.membership_rank ?? 0;
      membershipTier = student.membership_tier ?? null;
      hasParentSeat = student.has_parent_seat === true;
      ({ hasExplore, hasConcierge } = deriveMembershipAccess(
        membershipTier,
        membershipRank
      ));
    }
  }

  return {
    membershipRank,
    membershipTier,
    membershipPurchasedAt: raw?.membership_purchased_at ?? null,
    hasMembership: raw?.has_membership === true,
    hasParentSeat,
    hasExplore,
    hasConcierge,
    hasAgreedToCommunity: raw?.has_agreed_to_community === true,
    hasAccessedContent: raw?.first_content_visit_at != null,
    phoneNumber: raw?.phone_number ?? null,
    invitedParentEmail: invitation?.parent_email ?? null,
    parentInvitationStatus: (invitation?.status ?? null) as "pending" | "accepted" | null,
    parentInvitationAcceptedAt: invitation?.accepted_at ?? null,
    role,
  };
});

// Fetches the WhatsApp invite link from the config table.
// Wrapped in React.cache so the layout (which calls it to warm the cache)
// and the page (which uses the result) share a single DB round-trip.
export const fetchWhatsappLink = cache(async (): Promise<string> => {
  const supabase = createClient();
  const { data } = await supabase
    .from("config")
    .select("value")
    .eq("key", "whatsapp_invite_link")
    .single();
  const row = data as { value: string } | null;
  return row?.value ?? "";
});
