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
- **Notion client**: `lib/notion/client.ts` and `lib/notion/fetcher.ts` are server-side only — never import from client components. Use `NOTION_PAGE_IDS` from `lib/notion/config.ts` to look up page IDs by tier.
- **HubSpot client**: `lib/hubspot/client.ts` and `lib/hubspot/contacts.ts` are server-side only — never import from client components. All tracking calls use `trackHubSpotContact()` or `trackHubSpotNote()` which are fire-and-forget (`void`). Never `await` them.

---

## Product & Pricing

| Plan      | Price      | Notes |
| --------- | ---------- | ----- |
| Lite      | $49        | One-time. Core content library. |
| Explore   | $9.99/mo   | Subscription. Deeper guides and ongoing support. |
| Concierge | $19.99/mo  | Subscription. Full library + priority support, 1-on-1. |

Parent Pack ($29 one-time) gives a parent their own Supabase account linked to the student. Stripe is the source of truth for all entitlements. Live prices are stored in the `pricing` table and managed via `/admin/settings`.

---

## Out of scope

WhatsApp integration · custom AWS infrastructure · enterprise DRM · native mobile app · custom analytics beyond PostHog defaults.
