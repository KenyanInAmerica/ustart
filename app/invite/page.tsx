// Public page — no auth required. Unauthenticated parents land here after clicking
// the confirmation URL in their invitation email. The token is validated server-side;
// clicking Accept creates the parent user and sends a PKCE magic link email.

import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/service";
import { AcceptButton } from "./AcceptButton";

interface InvitePageProps {
  searchParams: { token?: string | string[] };
}

// Branded error card — shown when token is missing, expired, or already used.
function InviteError() {
  return (
    <div className="min-h-screen bg-[#05080F] flex flex-col items-center justify-center px-6">
      <Link
        href="/"
        className="font-syne font-extrabold text-xl tracking-[-0.03em] text-white mb-16"
      >
        UStart
      </Link>

      <div className="w-full max-w-[400px] bg-[#0C1220] border border-white/[0.07] rounded-2xl px-8 py-10 text-center">
        {/* Warning icon */}
        <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center mx-auto mb-6">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          </svg>
        </div>

        <h1 className="font-syne font-bold text-2xl tracking-[-0.03em] text-white mb-3">
          Link expired
        </h1>
        <p className="text-[15px] text-white/45 leading-relaxed">
          This invitation link has expired or is no longer valid. Ask the student
          to resend the invitation from their UStart dashboard.
        </p>
      </div>
    </div>
  );
}

export default async function InvitePage({ searchParams }: InvitePageProps) {
  // searchParams values can be string arrays when a query param appears multiple
  // times; take the first value and treat anything else as missing.
  const rawToken = searchParams.token;
  const token = Array.isArray(rawToken) ? rawToken[0] : rawToken;

  if (!token) {
    return <InviteError />;
  }

  const service = createServiceClient();
  const { data } = await service
    .from("parent_invitations")
    .select("id, parent_email")
    .eq("invite_token", token)
    .eq("status", "pending")
    .gt("invite_token_expires_at", new Date().toISOString())
    .maybeSingle();

  if (!data) {
    return <InviteError />;
  }

  const inv = data as { id: string; parent_email: string };

  // Token is valid — render the confirmation card. AcceptButton creates the parent
  // user and sends the magic link email when clicked; parentEmail is shown in the
  // success state so the parent knows which inbox to check.
  return (
    <div className="min-h-screen bg-[#05080F] flex flex-col items-center justify-center px-6">
      <Link
        href="/"
        className="font-syne font-extrabold text-xl tracking-[-0.03em] text-white mb-16"
      >
        UStart
      </Link>

      {/* AcceptButton owns the full card body — it swaps between invitation and
          success views so accepting doesn't leave stale invite content on screen. */}
      <div className="w-full max-w-[400px] bg-[#0C1220] border border-white/[0.07] rounded-2xl px-8 py-10">
        <AcceptButton token={token} parentEmail={inv.parent_email} />
      </div>
    </div>
  );
}
