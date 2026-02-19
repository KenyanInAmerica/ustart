import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

// Returns a Supabase client for use in Server Components, Server Actions, and Route Handlers.
// Reads and writes session cookies via next/headers so the session persists across requests.
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            // setAll is called when the session needs to be refreshed.
            // This will throw if called from a Server Component (read-only context),
            // but middleware keeps the session alive so that case can be safely ignored.
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // no-op: Server Component context — session refresh handled by middleware
          }
        },
      },
    }
  );
}
