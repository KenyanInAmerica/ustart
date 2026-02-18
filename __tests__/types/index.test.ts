import type { ProductSlug, User, Entitlement } from "@/types";

describe("types", () => {
  it("ProductSlug accepts valid product slugs", () => {
    const slug: ProductSlug = "ustart-lite";
    expect(slug).toBe("ustart-lite");
  });

  it("User type has required fields", () => {
    const user: User = { id: "u1", email: "test@test.com", stripeCustomerId: null };
    expect(user.id).toBe("u1");
    expect(user.email).toBe("test@test.com");
    expect(user.stripeCustomerId).toBeNull();
  });

  it("Entitlement type has required fields", () => {
    const entitlement: Entitlement = { userId: "u1", product: "explore", active: true };
    expect(entitlement.active).toBe(true);
  });
});
