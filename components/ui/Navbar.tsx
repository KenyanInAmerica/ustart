import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { NavbarClient } from "@/components/ui/NavbarClient";

// Async Server Component — reads the Supabase session server-side so the
// correct nav actions are rendered without a client-side flash or extra fetch.
export async function Navbar() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const service = createServiceClient();
    const { data: profile } = await service
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();
    isAdmin = (profile as { is_admin: boolean | null } | null)?.is_admin ?? false;
  }

  return <NavbarClient isAuthenticated={user !== null} isAdmin={isAdmin} />;
}
