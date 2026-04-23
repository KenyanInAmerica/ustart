import type { ProductAccent } from "@/lib/config/productAccents";

export type ContentCatalogId = "lite" | "explore" | "concierge" | "parent_pack";

export interface ContentCatalogEntry {
  id: ContentCatalogId;
  label: string;
  badge: string;
  description: string;
  href: string;
  accent: ProductAccent;
}

export const CONTENT_CATALOG: readonly ContentCatalogEntry[] = [
  {
    id: "lite",
    label: "UStart Lite",
    badge: "Lite",
    description:
      "Core resources to get started — banking, SSN, credit cards, and student essentials.",
    href: "/dashboard/content/lite",
    accent: "lite",
  },
  {
    id: "explore",
    label: "UStart Explore",
    badge: "Explore",
    description:
      "Everything in Lite plus deeper guides to help you settle in and thrive.",
    href: "/dashboard/content/explore",
    accent: "explore",
  },
  {
    id: "concierge",
    label: "UStart Concierge",
    badge: "Concierge",
    description:
      "Everything in Explore plus our most advanced resources for long-term success in the US.",
    href: "/dashboard/content/concierge",
    accent: "concierge",
  },
  {
    id: "parent_pack",
    label: "Parent Pack",
    badge: "Add-on",
    description:
      "Dedicated resources for parents supporting their student's journey in the US.",
    href: "/dashboard/content/parent-pack",
    accent: "parent_pack",
  },
] as const;

export function getStudentContentEntries(membershipTier: string | null): ContentCatalogEntry[] {
  switch (membershipTier) {
    case "concierge":
      return CONTENT_CATALOG.filter((entry) =>
        entry.id === "lite" || entry.id === "explore" || entry.id === "concierge"
      );
    case "explore":
      return CONTENT_CATALOG.filter(
        (entry) => entry.id === "lite" || entry.id === "explore"
      );
    case "lite":
      return CONTENT_CATALOG.filter((entry) => entry.id === "lite");
    default:
      return [];
  }
}
