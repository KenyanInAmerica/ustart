import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase";
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
      const meta = user.user_metadata as { student_id?: string; role?: string } | null;

      // If the OTP was issued via a parent invitation, the metadata carries
      // `role: "parent"` and `student_id`. Use the service role to update the
      // parent's profile and mark the invitation as accepted, bypassing RLS.
      if (meta?.role === "parent" && meta?.student_id) {
        const service = createServiceClient();

        await service
          .from("profiles")
          .update({ role: "parent", student_id: meta.student_id })
          .eq("id", user.id);

        await service
          .from("parent_invitations")
          .update({ status: "accepted", accepted_at: new Date().toISOString() })
          .eq("student_id", meta.student_id)
          .eq("status", "pending");
      }

      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  // Missing code or exchange failure → back to sign-in with an error indicator
  return NextResponse.redirect(`${origin}/sign-in?error=auth_failed`);
}
