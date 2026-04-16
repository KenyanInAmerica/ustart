# UStart Portal

UStart is a paid access portal for international students navigating life in the US — banking, credit, SSN, taxes. Revenue-validating V1 built with Next.js 14 (App Router) + TypeScript + Tailwind CSS, deployed on Vercel.

## Commands

```bash
npm run dev         # Start dev server (localhost:3000)
npm run build       # Production build
npm run lint        # ESLint check
npm run typecheck   # TypeScript type check (run after every change)
npm run test        # Jest test suite
```

Always run `typecheck` + `lint` + `test` before committing. All three must pass with zero failures.

---

## When to read sub-files

Before starting any task, read the sub-files relevant to your work:

- `docs/claude/architecture.md` — read when: working on any new file, modifying folder structure, adding routes, working with Supabase, using env vars
- `docs/claude/conventions.md` — read when: writing any TypeScript, components, server actions, or styling
- `docs/claude/testing.md` — read when: adding or modifying any code that requires tests
- `docs/claude/git.md` — read when: committing, branching, or opening PRs
- `docs/ustart-project-snapshot.md` — read when: finishing a feature, updating documentation, or need full project context (schema, feature list, TODOs, pre-launch checklist)

---

## Critical gotchas (apply to every task)

- **Supabase clients**: never import from `lib/supabase.ts` (dead file). Use `lib/supabase/client.ts` (browser), `lib/supabase/server.ts` (server components/actions), `lib/supabase/service.ts` (RLS bypass)
- **next.config.js must be CommonJS** (`module.exports`) — Next.js 14 does not support `.ts` config
- **Jest API route tests** need `/** @jest-environment node */` docblock — `NextRequest`/`NextResponse` are not available in jsdom
- **PDF watermarking**: embed customer email before serving — PDFs are never served as raw files
- **Stripe webhook** (`app/api/webhooks/stripe/route.ts`) is a stub pending Feature 12 — not yet implemented
- **Desktop/mobile parity**: any change to navigation, access gating, or UI state must be applied to both `Sidebar.tsx` and `MobileDrawer.tsx` in the same PR

---

## Product & Pricing

Three lifetime purchase tiers:

| Plan    | Price | Notes |
| ------- | ----- | ----- |
| Lite    | $49   | Core content library |
| Pro     | $99   | + full library, community |
| Premium | $149  | + priority support, 1-on-1, Parent Pack |

Subscriptions (Explore, Concierge) are add-ons for existing members only, not sold standalone. Parent Pack is a one-time add-on giving a parent their own Supabase account linked to the student. Stripe is the source of truth for all entitlements.

---

## Out of scope

WhatsApp integration · custom AWS infrastructure · enterprise DRM · native mobile app · custom analytics beyond PostHog defaults.
