# UStart Portal – CLAUDE.md

## Project Overview

UStart is a paid access portal that helps **international students navigate life in the United States** — banking, credit cards, SSN, taxes, and more. It is a revenue-validating V1 — prioritize speed, correctness, and simplicity over scalability.

Built with: **Next.js 14 (App Router) + TypeScript + Tailwind CSS**, deployed on **Vercel**.

See `README.md` for setup instructions and `package.json` for all available scripts.

---

## Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint check
npm run typecheck    # TypeScript type check (run after changes)
npm run test         # Run test suite
```

> Always run `typecheck` after a series of code changes before calling work done.

---

## Architecture

```
/app                        # Next.js App Router — pages and layouts
  /api
    /webhooks/stripe        # Stripe webhook handler (signature validation required)
  /(auth)                   # Auth-related pages
    /sign-in                # Magic link request
    /magic-link             # Post-send confirmation
  /dashboard                # Authenticated user dashboard
  /content                  # Gated content pages per product
  /account                  # Billing & account management
/components
  /ui                       # Reusable, presentational UI components
    Button.tsx
    Navbar.tsx              # Landing page fixed nav
    Hero.tsx                # Landing page hero section
    HowItWorks.tsx          # Landing page 3-step section
    Features.tsx            # Landing page feature grid
    Pricing.tsx             # Landing page pricing cards
    Footer.tsx              # Landing page footer
  /layout                   # Shared layout components (nav, footer) — for authenticated pages
/lib
  /supabase.ts              # Supabase browser client + createServiceClient()
  /stripe.ts                # Stripe client
  /resend.ts                # Resend client
/hooks
  /useUser.ts               # User session hook (client-side)
/types
  /index.ts                 # ProductSlug, User, Entitlement types
/__tests__                  # Jest test suite (mirrors source structure)
/references                 # Design references (HTML mockups, etc.) — not deployed
/public                     # Static assets
```

---

## Product & Pricing Model

Three **lifetime purchase** tiers — customers pay once and keep access forever.

| Plan    | Price | Includes |
| ------- | ----- | -------- |
| Lite    | $49   | Core content library, PDF resources, student account |
| Basic   | $99   | Everything in Lite + full library, community access |
| Premium | $199  | Everything in Basic + priority support, 1-on-1 sessions, Parent Pack |

- **Parent Pack** is an optional add-on (separate Supabase account, not a role/flag)
- **Subscriptions** are available only as an add-on for existing lifetime members — not sold standalone
- Stripe is the **source of truth** for all entitlements

---

## Services & Environment

| Service  | Purpose                         |
| -------- | ------------------------------- |
| Supabase | Auth (magic link) + PostgreSQL  |
| Stripe   | Payments, subscriptions, portal |
| Resend   | Transactional email             |
| PostHog  | Analytics                       |
| Vercel   | Hosting + Edge functions        |

**NEVER commit `.env` or `.env.local` files.** All secrets live in Vercel environment variables.

Required env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `NEXT_PUBLIC_POSTHOG_KEY`.

---

## Access Control Rules

| Product       | Access Type              | Revoke On              |
| ------------- | ------------------------ | ---------------------- |
| Lite          | Lifetime (one-time)      | Never                  |
| Basic         | Lifetime (one-time)      | Never                  |
| Premium       | Lifetime (one-time)      | Never                  |
| Parent Pack   | Lifetime add-on          | Never                  |
| Subscriptions | Active only              | Cancellation / failure |

- Grant/revoke access via Stripe webhook events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
- **ALWAYS validate Stripe webhook signatures** in `/app/api/webhooks/stripe` before processing any event
- Parent Pack = separate Supabase account linked to the student's `customer_id`. No shared credentials.

---

## Code Conventions

- **TypeScript strict mode** — no `any` types
- **Named exports** only — no default exports from component files (Next.js pages are exempt — they require default exports)
- **Server Components by default** — add `"use client"` only when needed (event handlers, hooks, browser APIs)
- **Tailwind only** for styling — no inline `style` props; complex gradients that can't be expressed as Tailwind arbitrary values go in `globals.css` as named CSS classes
- Keep API route handlers thin — move business logic into `/lib`
- Use `next/image` for all images, `next/link` for all internal navigation
- Responsive breakpoint: `md-900` (900px) is registered as a custom Tailwind screen — use `md-900:` prefix for desktop layouts
- Mobile-first: default styles are mobile, `md-900:` overrides are desktop

## Comments & Tests (Required for Every Feature)

For every component or feature implemented:

**Comments**
- Add succinct inline comments explaining non-obvious decisions — layout tricks, conditional logic, why a pattern was chosen
- Target audience: junior/mid-level engineers. Skip comments on self-evident code (e.g. `// render button`)
- Comment placement: above the block or on the same line for short notes

**Tests**
- Create a test file under `__tests__/` that mirrors the source path (e.g. `components/ui/Foo.tsx` → `__tests__/components/ui/Foo.test.tsx`)
- Every test file must cover at minimum: renders without error, key content is present, interactive elements (links/buttons) have correct `href`/behavior
- API route tests require `/** @jest-environment node */` at the top of the file
- Run `npm run test` and `npm run typecheck` after adding tests — both must pass before work is considered done

---

## Styling & Fonts

- **Fonts**: Syne (headings) and DM Sans (body) — loaded via `next/font/google` in `app/layout.tsx` as CSS variables `--font-syne` / `--font-dm-sans`. Use Tailwind classes `font-syne` and `font-dm-sans`.
- **CSS variables** defined in `globals.css`: `--bg-deep`, `--bg-card`, `--bg-card-hover`, `--border`, `--border-bright`, `--text-primary`, `--text-muted`, `--text-mid`
- **Animations** defined as Tailwind utilities in `tailwind.config.ts`: `animate-pulse-glow`, `animate-fade-up`, `animate-fade-up-1/2/3` (staggered)
- **Config file**: Next.js config is `next.config.js` (CommonJS) — not `.ts`. Next.js 14 does not support `.ts` config files.

---

## Key Gotchas

- **next.config.js must be CommonJS** (`module.exports`), not ESM — Next.js 14 throws if you use `.ts` or `export default` syntax in the config file.
- **Jest API route tests** need `@jest-environment node` docblock — `NextRequest`/`NextResponse` rely on the web `Request` global which is native in Node 18+ but not available in jsdom.
- **PDF watermarking**: Embed customer email + order ID before serving. PDFs are never served as raw files.
- **Stripe portal link**: Account page links to Stripe Customer Portal — do not build a custom billing UI.
- **Community page**: Is a placeholder only — display rules, collect agreement checkbox, unlock a link. No WhatsApp integration in scope.
- **Subscription state**: Never trust the database alone for access checks on subscription products — always verify against Stripe or use a recently-synced webhook timestamp.

---

## Out of Scope (Do Not Implement)

- WhatsApp group creation or management
- Custom AWS/backend infrastructure
- Enterprise DRM or device fingerprinting
- Native mobile app
- Custom analytics beyond PostHog defaults
- Any feature not explicitly listed in the SOW
