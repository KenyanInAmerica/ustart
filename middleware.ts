import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Routes that require an active session. Any sub-path also matches (startsWith check below).
const PROTECTED_PATHS = ["/dashboard", "/content", "/account"];

export async function middleware(request: NextRequest) {
  // Start with a passthrough response; may be replaced by a redirect below.
  // We pass the request into NextResponse.next() so that updated cookies
  // are forwarded to the browser in the same response.
  let supabaseResponse = NextResponse.next({ request });

  // Middleware needs its own Supabase client wired to Request/Response cookies
  // rather than the next/headers cookie store (which is only available in RSC context).
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          // Write updated cookies onto both the request (for downstream middleware)
          // and the response (so the browser receives them).
          // request.cookies.set only accepts (name, value) — options are for response cookies only.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() validates the JWT with the Supabase Auth server on every request.
  // Do NOT use getSession() here — it only reads the cookie without verification.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Unauthenticated users attempting to access protected routes → redirect to sign-in
  const isProtected = PROTECTED_PATHS.some((path) => pathname.startsWith(path));
  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    return NextResponse.redirect(url);
  }

  // Authenticated users visiting /sign-in → redirect to dashboard
  if (pathname === "/sign-in" && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Run on all paths except static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
