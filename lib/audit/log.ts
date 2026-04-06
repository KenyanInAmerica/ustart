// Fire-and-forget audit logging utility.
// Always call as: void logAction({ ... }) — never await.
// Failures are logged to console and silently swallowed so logging never
// blocks or breaks the main operation.

import { createServiceClient } from "@/lib/supabase/service";

export async function logAction({
  actorId,
  actorEmail,
  action,
  targetId,
  targetEmail,
  payload,
}: {
  actorId?: string;
  actorEmail?: string;
  action: string;
  targetId?: string;
  targetEmail?: string;
  payload?: Record<string, unknown>;
}): Promise<void> {
  try {
    const service = createServiceClient();
    const { error } = await service.from("audit_logs").insert({
      actor_id: actorId ?? null,
      actor_email: actorEmail ?? null,
      action,
      target_id: targetId ?? null,
      target_email: targetEmail ?? null,
      payload: payload ?? null,
    });

    if (error) {
      console.error("[audit] insert failed:", error.message);
    }
  } catch (err) {
    console.error("[audit] unexpected error:", err);
  }
}
