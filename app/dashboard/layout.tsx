import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileDashboardNav } from "@/components/dashboard/MobileDashboardNav";

// Maps DB tier slugs to sidebar display names.
const TIER_NAMES: Record<string, string> = {
  lite: "Lite",
  pro: "Pro",
  premium: "Premium",
};

// Derive two-letter initials from an email address.
// Splits the local part on . _ - to get name segments; falls back to first two chars.
function getInitials(email: string): string {
  const local = email.split("@")[0];
  const parts = local.split(/[._-]/);
  if (parts.length >= 2 && parts[0].length > 0 && parts[1].length > 0) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return local.slice(0, 2).toUpperCase();
}

// Persistent dashboard shell — wraps all /dashboard/* routes.
// Server Component: fetches the user session and membership tier server-side
// so the Sidebar and MobileDrawer receive real data without a client-side fetch.
// Route protection is handled by middleware — no redirect needed here.
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch the user's membership tier from the user_access view.
  // maybeSingle() returns null data (no error) when no row exists.
  const { data: access } = await supabase
    .from("user_access")
    .select("membership_tier")
    .maybeSingle();

  const rawTier =
    (access as { membership_tier: string | null } | null)?.membership_tier ??
    null;

  const userEmail = user?.email ?? "";
  const userInitials = userEmail ? getInitials(userEmail) : "U";
  const planName = rawTier ? (TIER_NAMES[rawTier] ?? rawTier) : "No active plan";
  // True when the user has any active membership row — used to gate UStart Lite in the nav.
  const hasMembership = rawTier !== null;

  return (
    <div className="flex min-h-screen bg-[#05080F]">
      {/* Desktop sidebar — self-hides below 860px via its own className */}
      <Sidebar
        userEmail={userEmail}
        userInitials={userInitials}
        planName={planName}
        hasMembership={hasMembership}
      />

      {/* Mobile top bar + drawer — only visible below 860px */}
      <MobileDashboardNav
        userEmail={userEmail}
        userInitials={userInitials}
        planName={planName}
        hasMembership={hasMembership}
      />

      {/* Main content area */}
      <main className="flex-1 min-[860px]:ml-[240px] px-5 pt-[80px] pb-8 min-[860px]:px-[56px] min-[860px]:py-[48px] max-w-full min-[860px]:max-w-[1100px]">
        {children}
      </main>
    </div>
  );
}
