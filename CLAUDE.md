# UStart Portal – CLAUDE.md

## Project Overview

UStart is a paid access portal for students (and optional parent co-access) to purchase and access gated content, resources, and community features. It is a revenue-validating V1 — prioritize speed, correctness, and simplicity over scalability.

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
/app                  # Next.js App Router — pages and layouts
  /api                # API route handlers (webhooks, etc.)
  /(auth)             # Auth-related pages (login, magic link)
  /dashboard          # Authenticated user dashboard
  /content            # Gated content pages per product
  /account            # Billing & account management
/components
  /ui                 # Reusable, presentational UI components
  /layout             # Shared layout components (nav, footer)
/lib                  # Utilities, shared logic, service clients
  /supabase.ts        # Supabase client (browser + server)
  /stripe.ts          # Stripe client + helpers
  /resend.ts          # Resend email client
/hooks                # Custom React hooks
/types                # Shared TypeScript types
/public               # Static assets
```

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

Stripe is the **source of truth** for user entitlements. Supabase stores the reflected state.

| Product     | Access Type              | Revoke On              |
| ----------- | ------------------------ | ---------------------- |
| UStart Lite | Lifetime (one-time)      | Never                  |
| Parent Pack | Lifetime (one-time)      | Never                  |
| Explore     | Active subscription only | Cancellation / failure |
| Concierge   | Active subscription only | Cancellation / failure |

- Grant/revoke access via Stripe webhook events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
- **ALWAYS validate Stripe webhook signatures** in `/app/api/webhooks/stripe` before processing any event
- Parent access = separate Supabase account linked to the student's `customer_id`. No shared credentials.

---

## Code Conventions

- **TypeScript strict mode** — no `any` types
- **Named exports** only — no default exports from component files
- **Server Components by default** — add `"use client"` only when needed (event handlers, hooks, browser APIs)
- **Tailwind only** for styling — no custom CSS files, no inline `style` props
- Keep API route handlers thin — move business logic into `/lib`
- Use `next/image` for all images, `next/link` for all internal navigation
- Mobile-first responsive design using Tailwind breakpoints (`sm:`, `md:`, `lg:`)

---

## Key Gotchas

- **PDF watermarking**: Embed customer email + order ID before serving. PDFs are never served as raw files.
- **Stripe portal link**: Account page links to Stripe Customer Portal — do not build a custom billing UI.
- **Community page**: Is a placeholder only — display rules, collect agreement checkbox, unlock a link. No WhatsApp integration in scope.
- **Parent seat**: Is a separate Supabase user, not a role or flag on the student account.
- **Subscription state**: Never trust the database alone for access checks on subscription products — always verify against Stripe or use a recently-synced webhook timestamp.

---

## Out of Scope (Do Not Implement)

- WhatsApp group creation or management
- Custom AWS/backend infrastructure
- Enterprise DRM or device fingerprinting
- Native mobile app
- Custom analytics beyond PostHog defaults
- Any feature not explicitly listed in the SOW
