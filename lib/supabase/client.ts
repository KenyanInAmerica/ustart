import { createBrowserClient } from "@supabase/ssr";
import { assertNotProduction } from "@/lib/env/guard";

// Returns a Supabase client for use in Client Components and hooks.
// Called as a factory (not a module-level singleton) so it works correctly
// when the module is loaded in both browser and test environments.
export function createClient() {
  assertNotProduction();
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
