import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { brand } from "@/lib/config/brand";
import { createServiceClient } from "@/lib/supabase/service";
import { AcceptButton } from "./AcceptButton";

interface InvitePageProps {
  searchParams: { token?: string | string[] };
}

function InviteError() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg)] px-6 py-16">
      <Link
        href="/"
        className="mb-10 font-primary text-2xl font-bold tracking-[-0.03em] text-[var(--accent)]"
      >
        {brand.name}
      </Link>

      <Card className="w-full max-w-[420px] border border-[var(--border)] text-center" padding="lg">
        <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--destructive)]">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          </svg>
        </div>

        <h1 className="mb-3 font-primary text-2xl font-bold tracking-[-0.03em] text-[var(--text)]">
          Link expired
        </h1>
        <p className="text-[15px] leading-relaxed text-[var(--text-muted)]">
          This invitation link has expired or is no longer valid. Ask the student to resend the invitation from their UStart dashboard.
        </p>
      </Card>
    </div>
  );
}

export default async function InvitePage({ searchParams }: InvitePageProps) {
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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg)] px-6 py-16">
      <Link
        href="/"
        className="mb-10 font-primary text-2xl font-bold tracking-[-0.03em] text-[var(--accent)]"
      >
        {brand.name}
      </Link>

      <Card className="w-full max-w-[420px] border border-[var(--border)]" padding="lg">
        <AcceptButton token={token} parentEmail={inv.parent_email} />
      </Card>
    </div>
  );
}
