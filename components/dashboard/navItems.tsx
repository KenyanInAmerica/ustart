// Shared nav item definitions — imported by both Sidebar (desktop) and MobileDrawer (mobile)
// so the two nav trees never drift out of sync.

import type { DashboardAccess } from "@/types";

export type NavItem = {
  label: string;
  href: string;
  // Set to true only for items that are statically always-locked (e.g. coming-soon).
  // Runtime access gating is handled by isNavItemLocked() below.
  locked?: boolean;
  icon: React.ReactNode;
};

export type NavSection = {
  label: string;
  items: NavItem[];
};

// Computes whether a nav item should be locked at runtime based on the user's
// entitlements. Falls back to item.locked for any item not explicitly matched.
export function isNavItemLocked(item: NavItem, access: DashboardAccess): boolean {
  switch (item.href) {
    case "/dashboard/lite":        return access.membershipRank < 1;
    case "/dashboard/pro":         return access.membershipRank < 2;
    case "/dashboard/premium":     return access.membershipRank < 3;
    case "/dashboard/parent-pack": return !access.hasParentSeat;
    case "/dashboard/explore":     return !access.hasExplore;
    case "/dashboard/concierge":   return !access.hasConcierge;
    case "/dashboard/community":   return !access.hasAgreedToCommunity;
    default:                       return item.locked ?? false;
  }
}

export const navSections: NavSection[] = [
  {
    label: "Main",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: (
          <svg className="w-4 h-4 opacity-70 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        ),
      },
    ],
  },
  {
    label: "My Content",
    items: [
      {
        label: "UStart Lite",
        href: "/dashboard/lite",
        icon: (
          <svg className="w-4 h-4 opacity-70 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        ),
      },
      {
        label: "UStart Pro",
        href: "/dashboard/pro",
        icon: (
          <svg className="w-4 h-4 opacity-70 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        ),
      },
      {
        label: "UStart Premium",
        href: "/dashboard/premium",
        icon: (
          <svg className="w-4 h-4 opacity-70 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        ),
      },
      {
        label: "Parent Pack",
        href: "/dashboard/parent-pack",
        icon: (
          <svg className="w-4 h-4 opacity-70 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        ),
      },
      {
        label: "Explore",
        href: "/dashboard/explore",

        icon: (
          <svg className="w-4 h-4 opacity-70 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
          </svg>
        ),
      },
      {
        label: "Concierge",
        href: "/dashboard/concierge",

        icon: (
          <svg className="w-4 h-4 opacity-70 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
        ),
      },
    ],
  },
  {
    label: "Community",
    items: [
      {
        label: "Community",
        href: "/dashboard/community",

        icon: (
          <svg className="w-4 h-4 opacity-70 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        ),
      },
    ],
  },
  {
    label: "Account",
    items: [
      {
        label: "Account & Billing",
        href: "/dashboard/account",
        icon: (
          <svg className="w-4 h-4 opacity-70 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
          </svg>
        ),
      },
    ],
  },
];
