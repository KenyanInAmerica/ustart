import { createClient } from "@/lib/supabase/server";
import { ProfileSection } from "@/components/account/ProfileSection";
import { BillingSection } from "@/components/account/BillingSection";

interface ActiveAddon {
  type: string;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

// Inside the dashboard layout — no auth guard needed (middleware protects /dashboard/*).
export default async function AccountPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("user_access")
    .select(
      "first_name, last_name, email, phone_number, university_name, country_of_origin, membership_tier, membership_purchased_at, active_addons, has_parent_seat"
    )
    .eq("id", user!.id)  // scope to the authenticated user
    .maybeSingle();

  const raw = data as {
    first_name: string | null;
    last_name: string | null;
    email: string;
    phone_number: string | null;
    university_name: string | null;
    country_of_origin: string | null;
    membership_tier: string | null;
    membership_purchased_at: string | null;
    active_addons: ActiveAddon[];
    has_parent_seat: boolean;
  } | null;

  return (
    <div>
      <h1 className="font-syne text-2xl font-bold tracking-[-0.03em] text-white mb-8">
        Account
      </h1>
      <ProfileSection
        firstName={raw?.first_name ?? null}
        lastName={raw?.last_name ?? null}
        email={raw?.email ?? user?.email ?? ""}
        phoneNumber={raw?.phone_number ?? null}
        universityName={raw?.university_name ?? null}
        countryOfOrigin={raw?.country_of_origin ?? null}
      />
      <BillingSection
        membershipTier={raw?.membership_tier ?? null}
        membershipPurchasedAt={raw?.membership_purchased_at ?? null}
        activeAddons={raw?.active_addons ?? []}
        hasParentSeat={raw?.has_parent_seat ?? false}
      />
    </div>
  );
}