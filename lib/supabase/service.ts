import { createClient } from "@supabase/supabase-js";

// Service role client for privileged server-side operations that must bypass RLS.
// Uses the service role key — never expose this client to the browser.
// Only import this in Server Actions, Route Handlers, and server utilities.
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
