export type ProductSlug = "ustart-lite" | "parent-pack" | "explore" | "concierge";

export interface User {
  id: string;
  email: string;
  stripeCustomerId: string | null;
}

export interface Entitlement {
  userId: string;
  product: ProductSlug;
  active: boolean;
}
