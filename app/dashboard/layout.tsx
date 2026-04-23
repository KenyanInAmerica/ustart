import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileDashboardNav } from "@/components/dashboard/MobileDashboardNav";
import { ParentShell } from "@/components/dashboard/ParentShell";
import { fetchDashboardAccess } from "@/lib/dashboard/access";
import { SignOutButton } from "@/components/dashboard/SignOutButton";
import { Footer } from "@/components/ui/Footer";
import { createServiceClient } from "@/lib/supabase/service";

// Maps DB tier slugs to sidebar footer display names.
const TIER_NAMES: Record<string, string> = {
  lite: "UStart Lite",
  explore: "UStart Explore",
  concierge: "UStart Concierge",
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

type ProfileRedirectRow = {
  id: string;
  intake_completed_at: string | null;
  role: "student" | "parent" | null;
  student_id: string | null;
};

// Persistent dashboard shell — wraps all /dashboard/* routes.
// Server Component: fetches the user session and full entitlement snapshot server-side
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

  if (!user) {
    return redirect("/sign-in");
  }

  const { data: profileData } = await supabase
    .from("profiles")
    .select("id, intake_completed_at, role, student_id")
    .eq("id", user.id)
    .maybeSingle();

  const profile = profileData as ProfileRedirectRow | null;

  if (profile?.role === "student" && profile?.intake_completed_at == null) {
    return redirect("/intake");
  }

  if (profile?.role === "parent") {
    const service = createServiceClient();
    const { data: studentProfileData } = await service
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", profile.student_id ?? "")
      .maybeSingle();

    const studentProfile = studentProfileData as {
      first_name: string | null;
      last_name: string | null;
    } | null;

    return (
      <ParentShell
        studentFirstName={studentProfile?.first_name ?? "Your student"}
        studentLastName={studentProfile?.last_name ?? null}
      >
        {children}
      </ParentShell>
    );
  }

  // fetchDashboardAccess is memoised with React.cache — calling it here and
  // in the streaming page sections results in only one DB round-trip per request.
  const access = await fetchDashboardAccess();

  const userEmail = user.email ?? "";
  const userInitials = userEmail ? getInitials(userEmail) : "U";
  const planName = access.membershipTier
    ? (TIER_NAMES[access.membershipTier] ?? access.membershipTier)
    : "No active plan";

  return (
    <div className="flex min-h-screen bg-[var(--bg)]">
      {/* Desktop sidebar — self-hides below 860px via its own className */}
      <Sidebar
        userEmail={userEmail}
        userInitials={userInitials}
        planName={planName}
        access={access}
      />

      {/* Mobile top bar + drawer — only visible below 860px */}
      <MobileDashboardNav
        userEmail={userEmail}
        userInitials={userInitials}
        planName={planName}
        access={access}
      />

      {/* Main content area — fills remaining width; flex-col so Footer stays at bottom */}
      <main className="flex flex-1 flex-col bg-[var(--bg)] px-5 pb-0 pt-[80px] min-[860px]:ml-[240px] min-[860px]:px-[56px] min-[860px]:pt-[48px]">
        {/* flex-1 lets this wrapper grow and push the Footer to the bottom of the viewport */}
        <div className="flex-1 max-w-5xl mx-auto w-full pb-8">
          {/* Desktop-only top bar with sign out — mobile nav has its own drawer */}
          <div className="hidden min-[860px]:flex justify-end mb-6">
            <div className="w-fit">
              <SignOutButton />
            </div>
          </div>
          {children}
        </div>
        <Footer />
      </main>
    </div>
  );
}
