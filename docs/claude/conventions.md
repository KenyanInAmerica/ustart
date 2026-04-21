# UStart — Code Conventions

## TypeScript

- **Strict mode** — no `any` types, ever. Use proper generics or type assertions with a cast comment explaining why.
- **Named exports only** from all files. Exception: `page.tsx` and `layout.tsx` require default exports (Next.js App Router requirement).
- No barrel (`index.ts`) re-export files — import directly from the source file.

---

## Components

**Server Components by default.** Add `"use client"` only when the component needs:
- Event handlers (`onClick`, `onChange`, etc.)
- React hooks (`useState`, `useEffect`, `useRef`, etc.)
- Browser APIs

**Wrapper pattern for streaming sections.** Data-fetching sections use a two-file pattern:
- `FooSection.tsx` — Server Component, fetches data, renders `<Suspense fallback={<FooSkeleton />}><Foo ... /></Suspense>`
- `Foo.tsx` — receives props, renders UI (may be server or client depending on interactivity)
- Skeletons live in `components/dashboard/skeletons/` or `components/admin/skeletons/`

**Desktop/mobile parity** — any nav, access-gating, or UI state change must be applied to both `Sidebar.tsx` (desktop) and `MobileDrawer.tsx` (mobile) in the same PR. Tests must cover both.

**Pure utility functions** (badge helpers, formatters) must not be colocated in `"use client"` files if they're needed in Server Components. Extract to a plain module in `/lib` with no directives.

---

## Styling

- **Tailwind only** — no inline `style` props. No CSS Modules, no styled-components.
- Complex gradients that can't be expressed as Tailwind arbitrary values go in `globals.css` as named classes (`.hero-dot-grid`, `.hero-glow`).
- **CSS variables** (defined in `globals.css`):
  - `--bg` — `#F2F1EF` — page background
  - `--bg-card` — `#FFFFFF` — card surfaces
  - `--bg-card-hover` — `#F8F7F5` — hovered card background
  - `--bg-subtle` — `#ECEAE7` — subtle backgrounds and locked states
  - `--border` — `rgba(28,43,58,0.10)` — default borders
  - `--border-md` — `rgba(28,43,58,0.16)` — medium-emphasis borders
  - `--border-hi` — `rgba(28,43,58,0.24)` — high-emphasis borders
  - `--text` — `#1C2B3A` — primary text
  - `--text-mid` — `rgba(28,43,58,0.68)` — mid-emphasis text
  - `--text-muted` — `rgba(28,43,58,0.42)` — muted text
  - `--accent` / `--accent-hover` — primary interactive blue and hover state
  - `--destructive` — warm red destructive state
- All color references must use CSS variables or Tailwind semantic classes. Do not hardcode hex colors in components. The only allowed exceptions are `lib/config/brand.ts` and `lib/config/productAccents.ts`.
- **Font classes**: `font-primary` is the single font utility. `Plus Jakarta Sans` is loaded via `next/font/google` in `app/layout.tsx` as `--font-primary`. Switching to Salmond later should require changing the root font import only.
- **Custom breakpoint**: `md-900` (900px) for desktop layouts. Mobile-first: default styles are mobile, `md-900:` overrides are desktop.
- **Animations** (defined in `tailwind.config.ts`): `animate-pulse-glow`, `animate-fade-up`, `animate-fade-up-1`, `animate-fade-up-2`, `animate-fade-up-3` (staggered).

---

## Navigation

- `next/link` for all internal navigation
- `next/image` for all images
- Nav button order for signed-in admin users: **Admin · Dashboard · Sign Out**
- Nav button order for signed-in non-admin users: **Dashboard · Sign Out**

---

## Server Actions

All server actions live in `lib/actions/` and follow this pattern:

```typescript
"use server";

export async function myAction(
  arg: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const supabase = createClient(); // lib/supabase/server.ts
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Not authenticated." };

    // ... business logic ...

    revalidatePath("/dashboard/relevant-page");
    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
```

Rules:
- Every action starts with a server-side auth check — never trust the client
- Return type is always `{ success: true } | { success: false; error: string }`
- Admin actions call `requireAdmin()` instead of the basic auth check
- Fire-and-forget audit logging: `void logAction({ ... })` — never `await`
- Success messages auto-dismiss after 3 seconds using `setTimeout` + `useEffect` cleanup

---

## Supabase Query Conventions

- For entitlement checks, always query `user_access` view, not `memberships`/`addons` directly
- Every `user_access` query must include `.eq("id", user.id)` — never fetch all rows
- Use `lib/supabase/server.ts` in server actions; `lib/supabase/service.ts` only when RLS must be bypassed (cross-user operations, admin actions, parent invitation flows)
- `@supabase/ssr` — never use the deprecated `@supabase/auth-helpers-nextjs`

---

## Data Fetching (Server Components)

- Use `React.cache()` for functions called multiple times per render tree (see `lib/config/getPricing.ts`, `lib/dashboard/access.ts`)
- Keep data-fetching functions in `lib/dashboard/` or `lib/admin/` — not inside page files
- Route handlers and page components stay thin; business logic goes in `/lib`

---

## UI Behaviour Rules

- No `window.confirm`, `window.alert`, or `window.prompt` — use custom modals (`DeleteUserModal`, etc.)
- No inline `style` props — Tailwind only
- Destructive actions require two-step confirmation (see `DeleteUserModal`)

---

## Comments

Add succinct inline comments explaining non-obvious decisions — layout tricks, conditional logic, why a pattern was chosen. Target audience: junior/mid-level engineers. Skip self-evident code (`// render button`). Place above the block or on the same line for short notes.

---

## What Is Explicitly Forbidden

- Importing from `lib/supabase.ts` (dead file — use `lib/supabase/client.ts`, `server.ts`, or `service.ts`)
- Default exports from component files (pages/layouts excepted)
- Inline `style` props
- `window.confirm` / `window.alert` / `window.prompt`
- `any` types
- Awaiting `logAction()` — must always be fire-and-forget (`void logAction(...)`)
- Serving PDFs without watermarking — always embed customer email first
