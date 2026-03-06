import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { DashboardAccess } from "@/types";

// React.cache deduplicates this call within a single render pass — both the
// layout (sidebar/drawer) and the page (content cards, StartHere) can call
// fetchDashboardAccess() and only one Supabase round-trip occurs per request.
export const fetchDashboardAccess = cache(async (): Promise<DashboardAccess> => {
  const supabase = createClient();

  const { data } = await supabase
    .from("user_access")
    .select(
      "membership_rank, membership_tier, has_membership, has_parent_seat, has_explore, has_concierge, has_agreed_to_community, first_content_visit_at"
    )
    .maybeSingle();

  const raw = data as {
    membership_rank: number | null;
    membership_tier: string | null;
    has_membership: boolean | null;
    has_parent_seat: boolean | null;
    has_explore: boolean | null;
    has_concierge: boolean | null;
    has_agreed_to_community: boolean | null;
    first_content_visit_at: string | null;
  } | null;

  return {
    membershipRank: raw?.membership_rank ?? 0,
    membershipTier: raw?.membership_tier ?? null,
    hasMembership: raw?.has_membership === true,
    hasParentSeat: raw?.has_parent_seat === true,
    hasExplore: raw?.has_explore === true,
    hasConcierge: raw?.has_concierge === true,
    hasAgreedToCommunity: raw?.has_agreed_to_community === true,
    hasAccessedContent: raw?.first_content_visit_at != null,
  };
});
