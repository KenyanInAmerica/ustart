"use server";

// Server action for sign-out — runs server-side so we can call logAction()
// before clearing the session. The client component cannot call logAction()
// directly because it uses the service client.

import { createClient } from "@/lib/supabase/server";
import { logAction } from "@/lib/audit/log";
import { AuditAction } from "@/lib/audit/actions";

export async function signOut(): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  void logAction({
    actorId: user?.id,
    actorEmail: user?.email ?? undefined,
    action: AuditAction.AUTH_SIGN_OUT,
  });

  await supabase.auth.signOut();
}
