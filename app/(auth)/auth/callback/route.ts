import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Supabase redirects here after the user clicks the magic link in their email.
// We exchange the one-time `code` query param for a persisted session cookie,
// then send the user to /dashboard. On failure, redirect to /sign-in with an error flag.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = createClient();
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && sessionData?.user) {
      const user = sessionData.user;

      // Block soft-deleted accounts before they reach /dashboard.
      // After exchangeCodeForSession the server client carries the new session,
      // so the profiles query runs as the authenticated user (RLS allows self-read).
      // We sign out immediately and send them to the error page so no cookie persists.
      const { data: profileData } = await supabase
        .from("profiles")
        .select("is_active")
        .eq("id", user.id)
        .maybeSingle();

      const profile = profileData as { is_active: boolean | null } | null;
      if (profile?.is_active === false) {
        await supabase.auth.signOut();
        return NextResponse.redirect(`${origin}/auth/error?error=account_deactivated`);
      }

      const meta = user.user_metadata as { student_id?: string; role?: string } | null;

      // If the OTP was issued via a parent invitation, the metadata carries
      // `role: "parent"` and `student_id`. Use the service role to update the
      // parent's profile and mark the invitation as accepted, bypassing RLS.
      if (meta?.role === "parent" && meta?.student_id) {
        const service = createServiceClient();

        // Guard against persistent metadata re-linking after unlinkParent():
        // raw_user_meta_data is never cleared on the auth.users row, so a parent
        // who has been unlinked would be re-linked on every subsequent sign-in
        // without these checks.
        const { data: currentProfile } = await service
          .from("profiles")
          .select("student_id")
          .eq("id", user.id)
          .maybeSingle();

        const { data: pendingInvitation } = await service
          .from("parent_invitations")
          .select("id")
          .eq("student_id", meta.student_id)
          .eq("status", "pending")
          .maybeSingle();

        const profile = currentProfile as { student_id: string | null } | null;
        const invitation = pendingInvitation as { id: string } | null;

        // Only link if not already linked to any student AND a pending invitation exists.
        if (!profile?.student_id && invitation) {
          await service
            .from("profiles")
            .update({ role: "parent", student_id: meta.student_id })
            .eq("id", user.id);

          await service
            .from("parent_invitations")
            .update({ status: "accepted", accepted_at: new Date().toISOString() })
            .eq("id", invitation.id);
        }
      }

      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  // Missing code or exchange failure → user-friendly error page.
  return NextResponse.redirect(`${origin}/auth/error`);
}
