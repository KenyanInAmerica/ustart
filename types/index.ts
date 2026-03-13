// Reserved for the Stripe webhook handler — not used by the dashboard access layer.
export type ProductSlug = "ustart-lite" | "parent-pack" | "explore" | "concierge";

// Reserved for the Stripe webhook handler — not used by the dashboard access layer.
export interface User {
  id: string;
  email: string;
  stripeCustomerId: string | null;
}

// Reserved for the Stripe webhook handler — not used by the dashboard access layer.
export interface Entitlement {
  userId: string;
  product: ProductSlug;
  active: boolean;
}

// Normalised entitlement snapshot derived from the user_access view.
// Computed once per request (via React.cache in lib/dashboard/access.ts)
// and shared between the layout (sidebar/drawer) and the page (cards, StartHere).
export interface DashboardAccess {
  // 0 = no plan, 1 = Lite, 2 = Pro, 3 = Premium
  membershipRank: number;
  // Raw tier slug for display (e.g. "lite", "pro", "premium") — null if no plan
  membershipTier: string | null;
  hasMembership: boolean;
  hasParentSeat: boolean;
  hasExplore: boolean;
  hasConcierge: boolean;
  hasAgreedToCommunity: boolean;
  // True once trackContentVisit() has stamped first_content_visit_at
  hasAccessedContent: boolean;
  // Phone number on file — used to pre-fill the community WhatsApp modal
  phoneNumber: string | null;
  // ISO timestamp of the active membership purchase — used in the account strip and billing section
  membershipPurchasedAt: string | null;
  // Parent seat invitation fields — only relevant for student accounts with has_parent_seat
  invitedParentEmail: string | null;
  parentInvitationStatus: "pending" | "accepted" | null;
  parentInvitationAcceptedAt: string | null;
  // parents see content driven by their linked student's entitlements
  role: "student" | "parent";
}
