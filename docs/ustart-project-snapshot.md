# UStart Portal — Project Snapshot

**Date:** April 21, 2026

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Supabase · Stripe (pending) · Resend · PostHog · Vercel

---

## Project Overview

UStart is a paid access portal for international students navigating life in the United States. Students purchase a membership tier, can add Parent Pack if needed, and can separately purchase support calls. Parents get their own separate login linked to the student's account.

### Core Model

- **Tiers (`memberships`)** — Lite (`one-time`), Explore (`monthly`), Concierge (`monthly`). Access is cumulative. One active membership per user at a time.
- **One-time add-ons (`one_time_purchases`)** — Parent Pack only. It gives a parent their own login linked to the student's account.
- **Purchasable calls (`call_bookings`)** — `arrival_call` and `additional_support_call`. Users can buy these multiple times.

Stripe is the source of truth for entitlements once integrated. Supabase reflects it.

---

## Repository

**GitHub:** https://github.com/KenyanInAmerica/ustart

**Deployed on:** Vercel · **Node version:** 18+

### Branch Model

| Branch | Purpose | Deploys to |
|---|---|---|
| `main` | Production-ready code | Vercel production (production Supabase) |
| `develop` | Integration branch — staging QA | Vercel preview scoped to develop (staging Supabase) |
| `feature/*` | Feature and bugfix work | Local only — PR into develop |

- All feature branches cut from `develop`
- PRs into `develop` and `main` require CI to pass (typecheck, lint, test)
- Direct pushes to `develop` and `main` are blocked by GitHub branch protection
- `develop` → `main` PRs promote staging to production

---

## Tech Stack & Services

| Service               | Purpose                                       |
| --------------------- | --------------------------------------------- |
| Next.js 14 App Router | Framework                                     |
| TypeScript (strict)   | Language                                      |
| Tailwind CSS          | Styling                                       |
| Supabase              | Auth (magic link) + PostgreSQL database       |
| Stripe                | Payments + subscriptions (not yet integrated) |
| Resend                | Transactional email                           |
| PostHog               | Analytics                                     |
| Vercel                | Hosting + Edge functions                      |
| Porkbun               | Domain                                        |
| Google Workspace      | Professional email                            |
| Stripe Atlas          | Incorporation                                 |

**Fonts**

- Plus Jakarta Sans — single primary font, loaded via `next/font/google` as CSS variable `--font-primary`. Substitute for brand font Salmond. To switch to Salmond: update the font import in `app/layout.tsx` only.
- `font-primary` Tailwind class replaces former `font-syne` and `font-dm-sans`

---

## Environment Variables

Never commit `.env` or `.env.local`. All secrets live in Vercel environment variables.

| Variable | Local | Staging | Production | Notes |
|---|---|---|---|---|
| `NEXT_PUBLIC_ENVIRONMENT` | `local` | `staging` | `production` | Never `production` in `.env.local` — enforced by `assertNotProduction()` |
| `NEXT_PUBLIC_SUPABASE_URL` | staging project URL | staging project URL | production project URL | Local dev always points at staging |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | staging anon key | staging anon key | production anon key | |
| `SUPABASE_SERVICE_ROLE_KEY` | staging service role key | staging service role key | production service role key | Never expose to browser |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | Vercel develop preview URL | `https://www.u-start.co.uk` | Used for absolute URL construction (www is primary; apex redirects to www) |
| `RESEND_API_KEY` | staging key | staging key | production key | Must be scoped to correct sending domain — staging key: staging.u-start.co.uk, production key: u-start.co.uk |
| `RESEND_FROM_EMAIL` | `hello@staging.u-start.co.uk` | `hello@staging.u-start.co.uk` | `hello@u-start.co.uk` | Sending address |
| `RESEND_NOTIFICATION_EMAIL` | `rosoti17@apu.edu` | `staging@u-start.co.uk` (not yet active — TODO) | `csr@u-start.co.uk` (not yet active — TODO) | Contact form admin notifications. Both addresses need activating in Google Workspace before launch. |
| `NEXT_PUBLIC_POSTHOG_KEY` | staging key | staging key | production key | |
| `NEXT_PUBLIC_POSTHOG_HOST` | `https://app.posthog.com` | `https://app.posthog.com` | `https://app.posthog.com` | |
| `STRIPE_SECRET_KEY` | test key | test key | live key | Feature 12 |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | test key | test key | live key | Feature 12 |
| `STRIPE_WEBHOOK_SECRET` | test secret | test secret | live secret | Feature 12 |

GitHub Actions secrets used by CI: `STAGING_SUPABASE_URL`, `STAGING_SUPABASE_ANON_KEY`, `STAGING_SERVICE_ROLE_KEY`.

---

## Color Palette

Defined in `app/globals.css` — use these exact names in Tailwind arbitrary values (e.g. `bg-[var(--bg-card)]`).

| Variable | Value | Usage |
|---|---|---|
| `--bg` | `#F2F1EF` | Page background (creme) |
| `--bg-card` | `#FFFFFF` | Card surfaces |
| `--bg-card-hover` | `#F8F7F5` | Hovered card background |
| `--bg-subtle` | `#ECEAE7` | Subtle backgrounds, locked states |
| `--border` | `rgba(28,43,58,0.10)` | Default borders |
| `--border-md` | `rgba(28,43,58,0.16)` | Medium emphasis borders |
| `--border-hi` | `rgba(28,43,58,0.24)` | High emphasis borders |
| `--text` | `#1C2B3A` | Primary text (navy) |
| `--text-mid` | `rgba(28,43,58,0.68)` | Mid-emphasis text |
| `--text-muted` | `rgba(28,43,58,0.42)` | Muted text |
| `--accent` | `#3083DC` | Primary interactive (sky blue) |
| `--accent-hover` | `#2470C7` | Accent hover state |
| `--destructive` | `#E54B4B` | Destructive actions (warm red) |
| `--shadow-sm/md/lg` | `elevation tokens` | Card shadows |

### Brand Palette

| Name | Hex | Usage |
|---|---|---|
| Sky Blue | `#3083DC` | CTAs, active states, Lite accent |
| Warm Red | `#E54B4B` | Alerts, destructive, admin badge |
| Creme | `#F2F1EF` | Page backgrounds |
| Navy | `#1C2B3A` | Primary text, headings |

### Phase Accent Colors

| Phase | Color | Hex |
|---|---|---|
| Before Arrival | Mint Green | `#4ECBA5` |
| First 7 Days | Warm Yellow | `#F5C842` |
| Settling In | Lavender | `#9B8EC4` |
| Ongoing Support | Sky Blue | `#3083DC` |

### Product Accent Colors

Defined in `lib/config/productAccents.ts`.

| Product | Hex |
|---|---|
| Lite | `#3083DC` |
| Explore | `#4ECBA5` |
| Concierge | `#9B8EC4` |
| Parent Pack | `#F5C842` |
| Community | `#4ECBA5` |

### Design System Notes

- Tagline: `"Your Move, Made Simple"` (from `brand.ts`, easily configurable)
- Design system is now fully light mode — dark theme removed entirely
- `ParentInvitationSection` is hidden behind `PARENT_INVITATION_ENABLED = false` — code intact, not rendered
- `components/layout/Nav.tsx` and `components/layout/Footer.tsx` were deleted as unused stubs during the design system overhaul

---

## Folder Structure

```
/__tests__               # Jest tests — mirrors source structure
/app
  /api/pdf               # PDF viewer API route — watermarks and serves PDFs
  /(auth)
    /sign-in             # Magic link sign-in page
    /auth/callback       # Supabase auth callback — PKCE exchange, inactive check, parent linking
    /auth/error          # Custom error page (expired link, account_deactivated)
  /admin                 # Admin portal — protected by is_admin flag
    /layout.tsx          # Admin shell layout with own sidebar
    /page.tsx            # Overview — stats (including inactive accounts count) and recent signups
    /users               # User management — inactive badge, Reactivate/Delete/Erase/Manage actions
    /community           # Community members view
    /invitations         # Parent invitations + manual linking tool (route kept, hidden from sidebar)
    /content             # PDF upload and content management
    /admins              # Admin access management
    /settings            # WhatsApp link, config, and pricing management
    /audit-log           # Admin audit log — paginated, filterable event history
      page.tsx           # Server Component — fetches rows, enforces date range gate
      AuditLogFilters.tsx # Client Component — filter bar with useTransition spinner
      PayloadCell.tsx    # Expandable JSON payload cell
      loading.tsx        # Route segment loading skeleton
  /invite
    page.tsx              # Parent invitation confirmation page — validates invite token server-side, renders Accept button or branded error state
    AcceptButton.tsx      # "use client" — handles Accept click, calls acceptInvitation(), shows inline success/error state
  /content               # Authenticated content index page
  /dashboard             # Authenticated student/parent portal
    /layout.tsx          # Dashboard shell layout (includes Footer)
    /page.tsx            # Dashboard main page
    /lite                # UStart Lite content
    /explore             # UStart Explore content
    /concierge           # UStart Concierge content
    /parent-pack         # Parent Pack content + invitation flow
    /account             # Account & billing page
    /my-documents        # Individually assigned PDFs
  /pricing               # Public pricing page (includes Footer)
  /privacy               # Privacy Policy page — added Feature 14
  /terms                 # Terms of Service page — added Feature 14
  /community-rules       # Public community rules page (placeholder)
/components
  /ui
    Button.tsx                    # Shared button component — primary, secondary, ghost, destructive variants with loading state
    Card.tsx                      # Shared card wrapper — configurable shadow and padding
    ChevronIcon.tsx, GetStartedLink.tsx
    SignOutButton.tsx, Navbar.tsx, NavbarClient.tsx, Footer.tsx
    ContactFormProvider.tsx    # React context — exposes useContactForm() hook. Added Feature 14.
    ContactPanel.tsx           # Slide-out contact panel (auth + unauth variants). Added Feature 14.
    ContactTriggerLink.tsx     # Inline "use client" button for server-rendered pages. Added Feature 14.
    SectionErrorBoundary.tsx   # Error boundary wrapper for streaming dashboard sections.
  /dashboard
    Sidebar.tsx, MobileTopBar.tsx, MobileDrawer.tsx, MobileDashboardNav.tsx, navItems.tsx
    Greeting.tsx, StartHere.tsx, StartHereSection.tsx
    ContentCards.tsx, ContentCardsSection.tsx, ContentGrid.tsx
    CommunitySection.tsx, CommunitySectionWrapper.tsx
    AccountStrip.tsx, AccountStripSection.tsx
    ParentInvitationSection.tsx, ParentInvitationWrapper.tsx  # Present but render-gated by PARENT_INVITATION_ENABLED = false
    AddonModal.tsx, PdfViewer.tsx (react-pdf backed), SignOutButton.tsx
    skeletons/  # Loading skeletons for each Suspense section
  /account   ProfileSection.tsx, BillingSection.tsx
  /admin     AdminSidebar.tsx, AdminStatsSection.tsx, RecentSignupsSection.tsx
             DeleteUserModal.tsx (two-step soft/hard delete confirmation — added Feature 14)
             UserPanel.tsx, AdminGrantForm.tsx, AdminRevokeButton.tsx
             InvitationLinkForm.tsx, ContentUploadForm.tsx, ContentDeleteButton.tsx
             UserPdfAssignment.tsx, PricingSection.tsx, SettingsForm.tsx
             CommunityExportButton.tsx
             skeletons/
  /pricing   BuyNowButton.tsx
/lib
  /supabase  client.ts, server.ts, service.ts
  /resend    client.ts (singleton Resend client)
             /templates
               contactNotification.ts  # Admin notification email template for contact form submissions
               parentInvitation.ts     # Parent invitation email template — CTA links to /invite confirmation page
  /dashboard access.ts (fetchDashboardAccess, fetchWhatsappLink)
  /admin     data.ts (fetchAdminOverview includes inactiveAccounts count)
             auditLog.ts (fetchAuditLog, AuditLogFilters, ACTION_GROUPS, PAGE_SIZE)
  /audit     actions.ts (AuditAction const enum + AuditActionType)
             log.ts (logAction — fire-and-forget insert into audit_logs)
             actionBadge.ts (actionBadgeClass, actionCategory — plain module, safe for Server Components)
  /pdf       watermark.ts, fetch.ts
  /config    brand.ts (centralised brand config — name, tagline, logo, font, colors, phase accents)
             productAccents.ts (per-product accent color mapping)
             pricing.ts (types only), getPricing.ts (fetch utils)
  /actions
    signOut.ts                  # signOut() — logs AUTH_SIGN_OUT then signs out
    updateProfile.ts            # updateProfile() — diff-based, logs changes
    acceptCommunityRules.ts     # acceptCommunityRules() — inserts agreement row
    trackContentVisit.ts        # trackContentVisit() — idempotent first-visit stamp
    contactForm.ts              # submitContactForm() — inserts submission, sends Resend notification
    parentInvitation.ts         # sendParentInvitation(), resendParentInvitation(),
                                #   cancelParentInvitation(), unlinkParent(), acceptInvitation()
                                #   Updated Feature 13: invite token flow (UUID + 72h expiry),
                                #   two-email pattern (admin.createUser + signInWithOtp)
    admin/admins.ts             # grantAdminAccess(), revokeAdminAccess()
    admin/content.ts            # uploadContentItem(), deleteContentItem(), etc.
    admin/invitations.ts        # adminLinkParent() — updated Feature 13: creates invite token row
    admin/settings.ts           # saveWhatsappLink()
    admin/updatePricing.ts      # updatePricing() — diff-based, logs changes
    admin/users.ts              # setUserMembershipTier(), setUserAddon(), assignContentToUser(),
                                #   revokeContentFromUser(), softDeleteUser(), hardDeleteUser(),
                                #   reactivateUser() — added Feature 14
/lib
  /env         guard.ts (assertNotProduction — throws if production env used outside prod build)
/hooks  /types  /references  /public
/docs
  ustart-project-snapshot.md  # Living project snapshot — updated on every PR
  staging-setup.md             # Staging environment setup guide
  /supabase-email-templates
    magic-link-staging.html
    magic-link-production.html
    confirm-signup-staging.html
    confirm-signup-production.html
  /claude                      # Claude Code context sub-files
    architecture.md            # Folder structure, DB schema, Supabase clients, env vars, auth flow
    conventions.md             # TypeScript, component, styling, action conventions
    testing.md                 # Test structure, coverage rules, Jest setup
    git.md                     # Branching, commits, PR workflow
  /migrations
    001_initial_schema.sql     # Canonical schema — living file, updated in-place after every schema change
    README.md                  # Schema change workflow and per-environment status
/public/favicon.ico    # Static favicon fallback
middleware.ts — updated Feature 13: /invite added as intentionally public route
/.github
  /workflows   ci.yml (typecheck + lint + test on PRs to develop and main)
  pull_request_template.md   # PR checklist — enforced on every PR
```

---

## Code Conventions

- TypeScript strict mode — no `any` types
- Named exports only — no default exports from component files (`page.tsx` and `layout.tsx` exempt)
- Server Components by default — `"use client"` only when needed
- Tailwind only — no inline `style` props, no custom CSS files
- `next/link` for all internal links, `next/image` for all images
- Mobile-first responsive design using Tailwind breakpoints
- `@supabase/ssr` — NOT the deprecated `@supabase/auth-helpers-nextjs`
- All server actions return `{ success: true } | { success: false; error: string }`
- All server actions begin with a server-side auth check
- All queries against `user_access` must include `.eq("id", user!.id)`
- Success messages auto-dismiss after 3 seconds using `setTimeout` + `useEffect` cleanup
- No `window.confirm`, `window.alert`, or `window.prompt` — use custom modals instead _(enforced as of Feature 14)_
- Nav button order for signed-in admin users: Admin, Dashboard, Sign Out
- Nav button order for signed-in non-admin users: Dashboard, Sign Out
- Pure utility functions (e.g. badge class helpers) must not be colocated inside `"use client"` files if they are needed in Server Components — extract them to a plain module in `/lib` with no directives
- `assertNotProduction()` must be called as the first line of all three Supabase client factories (`lib/supabase/client.ts`, `server.ts`, `service.ts`) — throws immediately if `NEXT_PUBLIC_ENVIRONMENT=production` is used outside a production build
- **Migration workflow** — `docs/migrations/001_initial_schema.sql` is the canonical schema and is updated in-place after every schema change. To apply a change: write the SQL, run it on staging first, verify, run on production, then update `001_initial_schema.sql` to reflect the new state and include that update in the same PR. See `docs/migrations/README.md` for the full workflow.
- **Snapshot must be updated before merging any branch.** When finishing a feature or bugfix, update this snapshot to reflect: new files and their purpose added to the folder structure, new database tables or columns, new environment variables, new conventions introduced, and feature status updated to ✅ Built. The updated snapshot is committed as part of the same PR. A PR without an updated snapshot is not mergeable.

---

## Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint check
npm run typecheck    # TypeScript type check
npm run test         # Jest test suite
```

Always run `typecheck` and `lint` after changes before committing. All tests must pass with zero failures before any commit.

**Current test count**: 505 tests across 69 suites (as of April 16, 2026). If the suite drops below this without a deliberate deletion, investigate before committing.

---

## Database Schema

### Tables

| Table                  | Purpose                                                                                                                                                                                    |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `profiles`             | Extends auth.users. Columns: id, email, first_name, last_name, role, student_id, phone_number, university_name, country_of_origin, arrival_date, graduation_date, city, intake_completed_at, first_content_visit_at, is_admin, is_active |
| `memberships`          | Tier purchases (`lite`, `explore`, `concierge`) with `billing` column. One active per user. Unique constraint on user_id.                                                               |
| `one_time_purchases`   | One-time purchases (`parent_seat`) only. Unique constraint on (user_id, type).                                                                                                            |
| `call_bookings`        | Tracks purchasable call bookings. Users can purchase multiple. Columns: id, user_id, type (`arrival_call` \| `additional_support_call`), status (`purchased` \| `booked` \| `completed` \| `cancelled`), stripe_payment_intent_id, calendly_event_id, booked_at, completed_at |
| `addons`               | Subscription rows for support-call products only: `arrival_call`, `additional_support_call`. Explore and Concierge are tiers, not addons.                                               |
| `parent_invitations`   | Tracks parent invitation state. Partial unique index on student_id for pending/accepted rows only. invite_token (UUID) and invite_token_expires_at added for pre-fetch-safe invitation flow. Token valid 72 hours. |
| `parent_content`       | Curated content for parent accounts. Placeholder.                                                                                                                                          |
| `community_agreements` | Tracks community rule acceptance per user.                                                                                                                                                 |
| `config`               | Key-value config store. Currently holds whatsapp_invite_link.                                                                                                                              |
| `content_items`        | PDF content library. Columns: id, title, description, tier, file_path, file_name, is_individual_only, uploaded_by, created_at, updated_at                                                  |
| `user_content_items`   | Individual user PDF assignments. Unique on (user_id, content_item_id).                                                                                                                     |
| `pricing`              | Single source of truth for all product pricing. Columns: id, name, description, price, billing, features (JSONB), is_public, display_order, stripe_product_id, stripe_price_id, updated_at |
| `contact_submissions`  | Stores contact form submissions until Resend is integrated. Columns: id, name, email, message, user_id, created_at. Added Feature 14.                                                      |
| `audit_logs`           | Immutable event log of all auditable actions. Columns: id, created_at, actor_id, actor_email, action, target_id, target_email, payload (JSONB), payload_text (generated). Added Audit Log feature. |
| `plan_task_templates`  | Plan builder template rows. Phase-based default tasks with title, description, active flag, and display offsets.                                                                            |
| `plan_tasks`           | Per-user task rows derived from plan templates. Tracks phase, due date, completion, and status.                                                                                             |
| `intake_responses`     | Per-user intake submission payloads stored as JSONB. Used with `profiles.intake_completed_at` to power future planning flows.                                                               |

### Column Notes

- `addons.type` — column is named `type`, NOT `product`. Do not use `product` in queries.
- `one_time_purchases.type` — column is named `type`, NOT `product`.
- `memberships.billing` — TEXT NOT NULL DEFAULT `'one-time'`. The live schema now carries billing cadence on the membership row itself.
- `profiles.arrival_date`, `profiles.graduation_date`, `profiles.city`, `profiles.intake_completed_at` — added for the plan/intake schema expansion.
- `addons` Stripe columns (`stripe_customer_id`, `stripe_subscription_id`, `stripe_product_id`, `current_period_end`) — not-null constraints dropped. Placeholders: `cus_placeholder`, `sub_placeholder`, `prod_placeholder`. TODO: replace in Feature 12.
- `one_time_purchases.stripe_payment_intent_id` — not-null constraint dropped. Placeholder: `pi_placeholder`. TODO: replace in Feature 12.
- `one_time_purchases.user_id` — now references `profiles(id)` ON DELETE CASCADE. Fixed in pre-launch schema cleanup Step 1.
- `pricing.name` and `pricing.billing` — read-only in admin UI. Changes require codebase and schema updates.
- `profiles.is_active` — boolean NOT NULL DEFAULT true. Added Feature 14. Inactive users are blocked at the auth callback (immediate sign-out + redirect to `/auth/error?error=account_deactivated`) and by middleware.
- `audit_logs.payload_text` — stored generated column (`payload::text`). Added to allow ILIKE substring search on JSONB payload via PostgREST `.or()`, which does not support type cast syntax (`::text`) inside filter strings. Never set manually — Postgres keeps it in sync automatically.

### Constraints

| Table.Column                         | Constraint                                                                                                   |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `profiles.role`                      | CHECK (role = ANY ('student', 'parent')) DEFAULT 'student'                                                   |
| `profiles.is_active`                 | boolean NOT NULL DEFAULT true (added Feature 14)                                                             |
| `memberships.status`                 | CHECK (status = ANY ('active', 'upgraded', 'revoked'))                                                       |
| `memberships.tier`                   | CHECK (tier = ANY ('lite', 'explore', 'concierge'))                                                          |
| `memberships.user_id`                | UNIQUE constraint                                                                                            |
| `one_time_purchases.status`          | CHECK (status = ANY ('active', 'refunded'))                                                                  |
| `one_time_purchases.type`            | CHECK (type = ANY ('parent_seat'))                                                                           |
| `one_time_purchases.(user_id, type)` | UNIQUE constraint                                                                                            |
| `parent_invitations`                 | Partial unique index `one_active_invite_per_student` on (student_id) WHERE status IN ('pending', 'accepted') |
| `call_bookings.type`                 | CHECK (type = ANY ('arrival_call', 'additional_support_call'))                                               |
| `call_bookings.status`               | CHECK (status = ANY ('purchased', 'booked', 'completed', 'cancelled'))                                      |
| `addons.type`                        | CHECK (type = ANY ('arrival_call', 'additional_support_call'))                                               |
| `content_items.tier`                 | CHECK (tier = ANY ('lite','explore','concierge','parent_pack'))                                             |
| `content_items.is_individual_only`   | boolean NOT NULL DEFAULT false                                                                               |
| `pricing.billing`                    | CHECK (billing = ANY ('one-time', 'monthly', 'yearly'))                                                      |

### audit_logs Migration (applied manually via Supabase SQL editor)

```sql
-- Applied to audit_logs
ALTER TABLE audit_logs
  ADD COLUMN payload_text TEXT GENERATED ALWAYS AS (payload::text) STORED;

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX audit_logs_payload_text_trgm_idx
  ON audit_logs USING gin (payload_text gin_trgm_ops);
```

---

## Key Functions & Views

- `handle_new_user()` — trigger that auto-creates a profiles row on every new Supabase auth signup
- `tier_rank(tier)` — returns numeric rank (Lite=1, Explore=2, Concierge=3)
- `tier_includes_parent_seat(tier)` — **dropped** in pre-launch schema cleanup Step 2
- `is_parent_of(student_id)` — security definer function used in RLS policy
- `user_access` view — returns full access state: has_membership, has_parent_seat, has_explore, has_concierge, membership_rank, active_addons, has_agreed_to_community, phone_number, first_name, last_name, university_name, country_of_origin, first_content_visit_at, invited_parent_email, parent_invitation_status, parent_invitation_accepted_at
  Note: `has_explore` and `has_concierge` are derived from `tier_rank(m.tier)`, not `addons` rows.

---

## Pricing Configuration

All live pricing data is fetched from the `public.pricing` table in Supabase. `lib/config/pricing.ts` contains TypeScript type definitions only — it is NOT a data source.

- `lib/config/pricing.ts` — `PricingItem` interface, `TierId`, `AddonId`, `ProductId` types
- `lib/config/getPricing.ts` — `getPricing()`, `getPublicPricing()`, `getPricingById()` using `React.cache()`
- Admin can update: description, price, features, is_public per product
- Admin cannot update: name, billing type (read-only — require codebase/schema changes)
- Stripe fields (`stripe_product_id`, `stripe_price_id`) — visible but read-only until Feature 12
- Pricing seeded with: lite ($49), explore ($9.99/mo), concierge ($19.99/mo), parent_pack ($29), arrival_call ($0.00 pending Morgan confirmation), additional_support_call ($0.00 pending Morgan confirmation)

---

## Supabase Storage

- Private bucket: `pdfs`
- Tier PDF path: `pdfs/{tier}/{filename}`
- Individual PDF path: `pdfs/individual/{userId}/{filename}`
- Signed URLs: 60 minute expiry for viewing
- Raw Storage URLs are never exposed to the browser
- All PDF access goes through `app/api/pdf/route.ts`
- PDF viewer: react-pdf backed (`react-pdf@7.7.3`) — renders via canvas, not an iframe
- Watermarking: pdf-lib stamps user email at bottom centre of every page
- NOTE: `/icon.png` 404 in dev console is expected and harmless — Next.js ImageResponse only pre-renders at build time. `/public/favicon.ico` resolves correctly in all environments.

---

## Tier Access Model

| Tier      | Lite Content | Explore Content | Concierge Content |
| --------- | ------------ | --------------- | ----------------- |
| Lite      | ✓            | ✗               | ✗                 |
| Explore   | ✓            | ✓               | ✗                 |
| Concierge | ✓            | ✓               | ✓                 |

| Product Type | Products | Table |
| ------------ | -------- | ----- |
| Tier | Lite, Explore, Concierge | `memberships` |
| One-time add-on | Parent Pack | `one_time_purchases` |
| Purchasable calls | 1:1 Arrival Call, Additional Support Call | `call_bookings` |

---

## Authentication Flow

- Magic link only — no passwords
- `shouldCreateUser: true` — same flow for new and returning users
- New user → Supabase fires `handle_new_user` trigger → profiles row auto-created
- Sign-in page: `app/(auth)/sign-in/page.tsx`
- Auth callback: `app/(auth)/auth/callback/route.ts`
  - Exchanges PKCE code for session
  - **Checks `profiles.is_active`** — if false, immediately calls `supabase.auth.signOut()` and redirects to `/auth/error?error=account_deactivated`. Added Feature 14.
  - Handles parent invitation linking via `user_metadata`
  - On exchange failure redirects to `/auth/error`
- Middleware protects `/dashboard`, `/content`, `/account`, and `/admin`:
  - `/dashboard`, `/content`, `/account` — unauthenticated users redirect to `/sign-in`
  - `/admin` — non-admin users redirect to `/dashboard`, unauthenticated to `/sign-in`
  - Inactive users (`is_active = false`) are **not** caught by middleware — they are blocked exclusively at the auth callback (session destroyed, redirected to `/auth/error?error=account_deactivated`)
- Sign out: redirects to `/` — navbar immediately reflects logged out state
- `/auth/error` page branches on `?error=` param:
  - Default (no param or unknown): "This link has expired" + Request new link CTA
  - `account_deactivated`: "Account deactivated" + contact form trigger + Back to home CTA

### Parent Invitation Auth Flow

- Callback reads `user_metadata` for `role: 'parent'` and `student_id`
- Guard 1 — checks if parent profile already has `student_id` set (alreadyLinked)
- Guard 2 — checks if invitation status is still valid (not cancelled)
- If not already linked AND invitation is pending: updates parent profile, marks invitation as accepted
- If already linked or invitation cancelled: skips linking — regular sign-in proceeds

Gmail pre-fetch issue: RESOLVED in Feature 13. The /invite confirmation page acts as a safe intermediate step — the email contains a plain confirmation URL with a UUID token (not a magic link), so pre-fetch bots cannot consume it. acceptInvitation() uses admin.createUser() + signInWithOtp() (PKCE-compatible) rather than generateLink() (implicit flow only).

---

## lib/supabase Clients

| File         | Client                                 | Usage                                      |
| ------------ | -------------------------------------- | ------------------------------------------ |
| `client.ts`  | `createBrowserClient` (@supabase/ssr)  | Client components only                     |
| `server.ts`  | `createServerClient` (@supabase/ssr)   | Server components, actions, route handlers |
| `service.ts` | `createClient` (@supabase/supabase-js) | Admin operations bypassing RLS             |

The service client uses `SUPABASE_SERVICE_ROLE_KEY` and must never be used in client components or exposed to the browser.

---

## Contact Form

Added Feature 14. Accessible from every page via the footer Contact button or inline `<ContactTriggerLink />` in legal page prose.

- `ContactFormProvider` wraps the root layout — provides `useContactForm()` hook (`open`, `close`) to any component tree
- `ContactPanel` — slide-out panel anchored bottom-right:
  - **Unauthenticated:** name, email, message fields (all editable)
  - **Authenticated:** email pre-populated (read-only), name pre-populated if on profile (editable if not set), message field only
  - Success auto-dismisses after 3s and closes panel
- `submitContactForm()` — server action, inserts into `contact_submissions`, attaches `user_id` if signed in, sends admin notification via Resend to `RESEND_NOTIFICATION_EMAIL`

---

## Admin User Management — Deletion & Reactivation

Added Feature 14.

### Server Actions (`lib/actions/admin/users.ts`)

- `softDeleteUser(userId)` — sets `profiles.is_active = false`. Guards against deleting admin accounts.
- `hardDeleteUser(userId)` — calls `service.auth.admin.deleteUser()` with full cascade through FK tables. Guards against deleting admin accounts.
- `reactivateUser(userId)` — sets `profiles.is_active = true`.
- All three require a valid admin session via `requireAdmin()`.

### UI (`/admin/users`)

- Inactive rows display a muted **Inactive** badge next to the email address
- Action column for inactive non-admin rows: **Reactivate** (green) · **Erase** (red) · **Manage**
- Action column for active non-admin rows: **Delete** (red) · **Manage**
- Action column for admin rows: **Manage** only
- `DeleteUserModal` — two-step confirmation:
  - Active user: soft-delete step (checkbox + Deactivate Account) → optional hard-delete expansion (Permanent erasure link → second checkbox + Delete Permanently)
  - Already-inactive user: skips soft-delete step entirely, shows "Account already deactivated" notice, surfaces hard-delete directly
- **Inactive accounts** count shown as a stat card on `/admin` overview page

---

## Audit Log

Added as a standalone feature after Feature 14.

### Architecture

Three-layer design in `lib/audit/`:

**`lib/audit/actions.ts` — Action registry**
All auditable action strings as a `const` object (`AuditAction`) with a companion `AuditActionType` union type. Using `as const` rather than a TypeScript `enum` means values are plain strings at runtime — storable and queryable in Postgres without mapping.

**`lib/audit/log.ts` — Fire-and-forget logger**
`logAction({ actorId?, actorEmail?, action, targetId?, targetEmail?, payload? })` inserts into `audit_logs` via the service client. Every call site uses `void logAction(...)` — never `await`. The function catches all errors internally and logs to console only. This is deliberate: audit logging must never block or fail a user-facing action. A missed log write is acceptable; a failed purchase or sign-in is not.

**`lib/audit/actionBadge.ts` — Badge styling**
Badge colour helpers extracted into a plain (no directives) module so they can be imported in both Server Components (`page.tsx`) and Client Components (`AuditLogFilters.tsx`). If this code lived inside a `"use client"` file, any Server Component importing it would be forced to become a client component — a fundamental Next.js App Router constraint.

### What Gets Logged

| Category | Actions |
|---|---|
| Auth | Sign-in, sign-out, sign-in blocked (inactive account) |
| Profile | Fields that actually changed — diff only, not full snapshot |
| Membership | Stripe webhook — purchase, upgrade, add-on subscribed/cancelled, parent pack |
| Parent | Invitation sent/resent/cancelled/accepted, parent unlinked |
| Community | Rules accepted |
| Admin — Users | Soft delete, hard delete, reactivate |
| Admin — Access | Grant/revoke admin |
| Admin — Content | Upload, delete, assign |
| Admin — Pricing | Fields that actually changed — diff only |
| Admin — Settings | Settings updated |
| Admin — Parent | Manual link, invitation cancelled |

Payload structure varies by action: auth events carry `{ method }`, admin user actions carry `{ targetEmail }`, diff-based actions carry `{ changedFields: { fieldName: { from, to } } }`.

### Key Design Decisions

**Sign-out required a Server Action (`lib/actions/signOut.ts`).** `SignOutButton` previously called `supabase.auth.signOut()` directly on the client — no server context, no logging possible. The fix: a proper Server Action that fetches the current user, calls `void logAction(AUTH_SIGN_OUT)`, then signs out server-side.

**`requireAdmin` extended to return `adminEmail`.** Previously returned only `{ ok: true, adminId }`. All admin action log calls need the actor's email. Rather than adding a second DB query per action, `requireAdmin` was updated to return `adminEmail` from the same profiles lookup it already performs.

**Hard-delete captures target email before deletion.** The `auth.users` cascade deletes the profile row when `auth.admin.deleteUser()` runs. Any email lookup after that point returns nothing. The guard query was extended to `select("is_admin, email")` so the email is captured in the same query that authorises the operation, before deletion runs.

**Diff-based logging for profile and pricing updates.** Both `updateProfile` and `updatePricing` fetch the current row before writing, diff old vs new, and log only the changed fields with `{ from, to }` pairs. Logging full state snapshots on every save would make the log noisy and unreadable.

**`payload_text` generated column for payload search.** PostgREST's `.or()` filter parser does not support Postgres type cast syntax (`::text`) inside filter strings — `payload::text.ilike.%x%` causes a parse error and returns zero results. The solution is a stored generated column that materialises `payload::text` as a regular text column, which PostgREST accepts cleanly in `.or()` filters. A GIN trigram index makes ILIKE substring searches fast.

### `/admin/audit-log` Page

- **Server Component** (`page.tsx`) — fetches rows via `fetchAuditLog`, enforces date range gate (skips DB query and shows prompt if no `from`/`to` in URL params)
- **Client Component** (`AuditLogFilters.tsx`) — filter bar with local state; `apply()` wraps `router.push()` in `useTransition` so `isPending` drives a spinner inside the Apply button. Date range is required — `apply()` blocks with an error message if either field is empty.
- **Filters:** action type (grouped checkbox dropdown), date range (required), role (All/Admin/User), text search (email, action, payload)
- **Pagination:** URL search params, preserved across filter changes
- **Text search** covers: `actor_email`, `target_email`, `action`, `payload_text`

---

## Dashboard Build Plan

| Feature    | Description                                  | Status                          |
| ---------- | -------------------------------------------- | ------------------------------- |
| Design System | Light mode overhaul, brand identity, component library | ✅ Built |
| Phase 2 Schema Changes | Membership rename, intake fields, planning tables, pricing/product model updates | ✅ Built |
| Feature 1  | Shell & Layout                               | ✅ Built                        |
| Feature 2  | Greeting & User State                        | ✅ Built                        |
| Feature 3  | Start Here / Onboarding Progress             | ✅ Built                        |
| Feature 4  | Content Cards with Access Gating             | ✅ Built                        |
| Feature 5  | Community Section                            | ✅ Built                        |
| Feature 6  | Account & Billing                            | ✅ Built                        |
| Feature 7  | Parent Seat Invitation Flow                  | ✅ Built                        |
| Feature 8  | Layout Fix, Codebase Audit & Refactor        | ✅ Built                        |
| Bugfix-1   | Entitlement Guards, Column Fix & Parent Flow | ✅ Built                        |
| Feature 9  | Admin Page                                   | ✅ Built                        |
| Feature 10 | Content Pages & PDF Infrastructure           | ✅ Built                        |
| Feature 11 | Pricing Page & Upgrade Flow                  | ✅ Built                        |
| Bugfix-2   | Parent Flow, Admin Stats & UI Polish         | ✅ Built                        |
| Feature 14 | Legal Pages, Browser Popups & User Deletion  | ✅ Built                        |
| Audit Log  | Admin audit log with full event tracking across all user and admin actions | ✅ Built |
| Env Setup  | Staging environment, CI pipeline, branch model, migration workflow, production guard | ✅ Built |
| Pre-launch | Schema Cleanup & Production Config           | 🔄 In Progress (Steps 1–2 done) |
| Feature 12 | Stripe Integration                           | ⏸ Deferred — tier structure now locked to Lite / Explore / Concierge |
| Feature 13 | Resend Integration                           | ✅ Built                         |

---

## Pre-Launch Schema Cleanup

Run all steps in order in the Supabase SQL Editor before starting Feature 12.

### ✅ Step 1 — Fix inconsistent FK reference (SCHEMA-004) — DONE

```sql
ALTER TABLE public.one_time_purchases
  DROP CONSTRAINT one_time_purchases_user_id_fkey;
ALTER TABLE public.one_time_purchases
  ADD CONSTRAINT one_time_purchases_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
```

### ✅ Step 2 — Remove no-op function — DONE

```sql
DROP FUNCTION IF EXISTS public.tier_includes_parent_seat(text);
```

### Step 3 — Restore Stripe not-null constraints

Only run AFTER Stripe webhooks are live and confirmed working:

```sql
ALTER TABLE public.addons
  ALTER COLUMN stripe_customer_id SET NOT NULL,
  ALTER COLUMN stripe_subscription_id SET NOT NULL,
  ALTER COLUMN stripe_product_id SET NOT NULL,
  ALTER COLUMN current_period_end SET NOT NULL;

ALTER TABLE public.one_time_purchases
  ALTER COLUMN stripe_payment_intent_id SET NOT NULL;
```

### Step 4 — Update pricing table with real Stripe IDs

Run after Stripe products and prices are created in the Stripe dashboard.

```sql
UPDATE public.pricing SET stripe_product_id = 'prod_xxx', stripe_price_id = 'price_xxx' WHERE id = 'lite';
-- repeat for explore, concierge, parent_pack, arrival_call, additional_support_call
```

### Step 5 — Export schema

```bash
supabase db dump --schema-only -f docs/ustart-schema-v4.sql
```

### Step 6 — Update production URLs

Update in Supabase Dashboard → Authentication → URL Configuration:

- Site URL: `https://yourdomain.com`
- Redirect URLs: `https://yourdomain.com/auth/callback`

---

## Known Issues / Things to Watch

- Gmail pre-fetch consuming parent invitation magic link — RESOLVED in Feature 13. Fix: /invite confirmation page + two-email flow. generateLink() does not support PKCE; acceptInvitation() uses signInWithOtp() instead.
- KNOWN-002 — PDF scrolling performance on mobile — react-pdf canvas renderer may be slower on low-end devices. Revisit post-launch if user complaints arise.
- `/icon.png` 404 in dev console — harmless. Next.js ImageResponse only pre-renders at build time. `/public/favicon.ico` resolves correctly in all environments.
- **`payload_text` migration must be applied before deploying any code that references it.** If the column doesn't exist, the `.or()` filter silently returns zero results (`fetchAuditLog` catches the error and returns `{ rows: [], total: 0 }`). Apply the migration first, then deploy.
- **Audit log date range is enforced in the UI only.** `fetchAuditLog` will run a full-table query if called without `from`/`to`. Any future entry point to the audit log (new admin page, API route, etc.) must enforce the date range independently.
- **`logAction` errors are silent** — caught and written to `console.error` / Vercel function logs only. If audit completeness becomes a compliance requirement, a dead-letter queue or retry mechanism is needed. The current fire-and-forget design is intentionally lossy.

---

## Active TODOs

**Code**

- Replace placeholder Stripe IDs in `addons` and `one_time_purchases` (Feature 12)
- Update magic link email template — currently hardcoded to `http://localhost:3000`
- PDF streaming — replace base64 with binary streaming in `/api/pdf` (post-launch)
- Activate `staging@u-start.co.uk` in Google Workspace, then set as `RESEND_NOTIFICATION_EMAIL` in Vercel staging
- Reactivate `csr@u-start.co.uk` in Google Workspace (currently archived), then set as `RESEND_NOTIFICATION_EMAIL` in Vercel production
- Notify parent via Resend when unlinked (see `TODO` in `lib/actions/parentInvitation.ts → unlinkParent`) — deferred post-launch
- Confirm Resend API keys are scoped to correct sending domains — staging key: staging.u-start.co.uk, production key: u-start.co.uk

**Business Owner Decisions Pending**

- Confirm pricing for `arrival_call` and `additional_support_call` with Morgan — currently `0.00` placeholders
- Confirm upgrade pricing model — proration vs full price
- Confirm parent-to-student relationship — currently one parent → one student
- Define parent content model — `parent_content` table is a placeholder
- Explore content management approach — currently PDFs, may change to web-based guides
- Concierge booking flow — Calendly embed or similar when service is ready
- Community platform — WhatsApp group admin approval setting recommended
- Copy audit — run once business owner confirms all content descriptions per tier
- Review and approve Privacy Policy and Terms of Service placeholder copy (added Feature 14)

---

## Pre-Launch Checklist

- [ ] Run remaining pre-launch schema cleanup steps (Steps 3–6)
- [ ] Apply `audit_logs` `payload_text` generated column and GIN trigram index (see audit_logs Migration above)
- [ ] Set email subject lines in Supabase Email Templates
- ✅ SMTP → Resend connected (both projects — staging.u-start.co.uk and u-start.co.uk)
- ✅ Sender name + From address set (both projects)
- ✅ Update Site URL and Redirect URLs (both projects — u-start.co.uk and staging.u-start.co.uk)
- [ ] Activate `staging@u-start.co.uk` and `csr@u-start.co.uk` in Google Workspace before launch
- [ ] Confirm Resend API keys are scoped to correct sending domains (staging key → staging.u-start.co.uk, production key → u-start.co.uk)
- [ ] Export full schema: `supabase db dump --schema-only -f docs/ustart-schema-v4.sql`
- [ ] Run copy/naming consistency audit against live codebase
- [ ] Business owner to review and approve Privacy Policy and Terms of Service

---

## Supabase Configuration Checklist

- ✅ Project created
- ✅ Schema applied (all tables including content_items, user_content_items, pricing, contact_submissions, audit_logs, plan_task_templates, plan_tasks, intake_responses)
- ✅ Parent invitation UI hidden in dashboard (`PARENT_INVITATION_ENABLED = false`) and admin sidebar link hidden pending Parent Pack simplification
- ✅ RLS enabled on all tables
- ✅ handle_new_user trigger active
- ✅ is_parent_of security definer function active
- ✅ Storage bucket `pdfs` created (private)
- ✅ pricing table seeded with all six products
- ✅ URL Configuration → Site URL: http://localhost:3000 (update before launch)
- ✅ URL Configuration → Redirect URLs: http://localhost:3000/auth/callback
- ✅ Email Templates → Magic Link updated with branded template
- ✅ Email Templates → Confirm Signup updated
- ⏸ audit_logs payload_text generated column + GIN index (apply before launch — see migration above)
- ✅ SMTP → Resend connected (staging: staging.u-start.co.uk, production: u-start.co.uk)
- ✅ Sender name + From address set on both projects

---

## Future Features (Post-Launch)

- Role-based access control (RBAC) — replace `is_admin` boolean with `admin_role` enum
- Admin API routes — migrate admin server actions to dedicated API routes
- Notifications — 'what's new' or content update indicator
- PDF watermarking with order ID (currently email only)
- PDF streaming — replace base64 encoding with binary stream in `/api/pdf`

---

## Documentation (`/docs`)

Tracked in git — keep these up to date as the project evolves.

| File                          | Purpose                          |
| ----------------------------- | -------------------------------- |
| `ustart-project-snapshot.md`  | This document (current snapshot) |
| `staging-setup.md`            | Staging environment setup guide  |
| `migrations/README.md`        | Migration rules, run order, per-environment status |
| `migrations/00N_*.sql`        | Numbered SQL migration files — apply in order via Supabase SQL Editor |

## Reference Files (`/references`)

Not tracked in git — design mockups and original schema exports for reference only.

| File                               | Purpose                                                    |
| ---------------------------------- | ---------------------------------------------------------- |
| `ustart-schema-v3.sql`             | Original schema — outdated, do not use                     |
| `ustart-project-snapshot_md.pdf`   | v1 snapshot (March 20, 2026) — superseded by this document |
| `ustart-project-snapshot-v2.md`    | Previous version — superseded by this document             |
| `landing-page.html`                | Landing page visual reference                              |
| `ustart-dashboard-shell-reference.html` | Dashboard shell mockup                                |
| `ustart-magic-link-email.html`     | Magic link email template                                  |

---

## How to Start a New Chat

When using Claude Code in the repository, `CLAUDE.md` routes Claude to the relevant sub-files in `docs/claude/` automatically. No manual setup needed.

When starting a fresh chat outside Claude Code (e.g. pasting context manually):

1. Start a fresh Claude conversation
2. Upload this snapshot file (`ustart-project-snapshot.md`) as your first attachment
3. Add the prefix:
   > "Here is the project snapshot for UStart. We are continuing development and are ready to build [FEATURE NAME]. Please read this carefully before we begin."
4. Then describe the feature or fix you are working on.

---

_End of snapshot — updated April 16, 2026_
