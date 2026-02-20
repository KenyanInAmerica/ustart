import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileDashboardNav } from "@/components/dashboard/MobileDashboardNav";

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
// Server Component: fetches the user session server-side so Sidebar and
// MobileDrawer receive real user data without a client-side fetch.
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

  const userEmail = user?.email ?? "";
  const userInitials = userEmail ? getInitials(userEmail) : "U";
  // Plan name is hardcoded for now — dynamic entitlement gating comes in Feature 4
  const planName = "UStart Lite";

  return (
    <div className="flex min-h-screen bg-[#05080F]">
      {/* Desktop sidebar — self-hides below 860px via its own className */}
      <Sidebar
        userEmail={userEmail}
        userInitials={userInitials}
        planName={planName}
      />

      {/* Mobile top bar + drawer — only visible below 860px */}
      <MobileDashboardNav
        userEmail={userEmail}
        userInitials={userInitials}
        planName={planName}
      />

      {/* Main content area */}
      <main className="flex-1 min-[860px]:ml-[240px] px-5 pt-[80px] pb-8 min-[860px]:px-[56px] min-[860px]:py-[48px] max-w-full min-[860px]:max-w-[1100px]">
        {children}
      </main>
    </div>
  );
}
