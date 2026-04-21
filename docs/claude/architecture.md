# UStart — Architecture Reference

## Folder Structure

```
/app                              # Next.js App Router — all routes live here
  /(auth)
    layout.tsx                    # Centered auth layout
    sign-in/page.tsx              # Magic link request form
    magic-link/page.tsx           # Post-send confirmation screen
    auth/callback/route.ts        # PKCE exchange, is_active check, parent linking
  /auth/error/page.tsx            # Error page — expired link, account_deactivated
  /dashboard
    layout.tsx                    # Dashboard shell (Sidebar + MobileTopBar + Footer)
    page.tsx                      # Main dashboard — Greeting, StartHere, ContentCards, Community
    account/page.tsx              # Account & billing
    lite/page.tsx                 # Lite tier content
    pro/page.tsx                  # Pro tier content
    premium/page.tsx              # Premium tier content
    parent-pack/page.tsx          # Parent Pack + invitation flow
    explore/page.tsx              # Explore add-on content
    concierge/page.tsx            # Concierge add-on content
    my-documents/page.tsx         # Individually assigned PDFs
  /admin
    layout.tsx                    # Admin shell (AdminSidebar)
    page.tsx                      # Overview — stats, recent signups
    users/page.tsx                # User management — entitlements, delete, reactivate
    invitations/page.tsx          # Parent invitations + manual admin linking
    content/page.tsx              # PDF upload, tier assignments, per-user assignments
    admins/page.tsx               # Grant/revoke admin access
    community/page.tsx            # Community members list + CSV export
    settings/page.tsx             # WhatsApp link, pricing management
    audit-log/page.tsx            # Audit log — filterable, paginated event history
  /api
    pdf/route.ts                  # PDF download — access check, fetch, watermark, serve
    webhooks/stripe/route.ts      # Stripe webhook — STUB, pending Feature 12
  /invite
    page.tsx                      # Parent invitation confirmation (public, no auth)
    AcceptButton.tsx              # "use client" — calls acceptInvitation() on click
  /community-rules/page.tsx       # Public community rules page
  /content/page.tsx               # Authenticated content index placeholder
  /pricing/page.tsx               # Public pricing page
  /privacy/page.tsx               # Privacy Policy
  /terms/page.tsx                 # Terms of Service
  layout.tsx                      # Root layout — fonts, metadata, ContactFormProvider
  page.tsx                        # Landing page
  globals.css                     # CSS variables, keyframes, named gradient classes

/components
  # NOTE: components/layout/ does not exist — deleted April 2026 (unused stubs, no imports).
  # Landing page nav/footer → components/ui/. Authenticated layout → components/dashboard/.
  /ui                             # Presentational, reusable UI components (mostly landing page)
    Navbar.tsx                    # Landing page fixed nav
    NavbarClient.tsx              # Client navbar shell — scroll shadow, mobile menu
    Hero.tsx                      # Landing page hero
    HowItWorks.tsx                # 3-step section
    Features.tsx                  # Feature grid
    Pricing.tsx                   # Landing page pricing cards
    Footer.tsx                    # Landing page footer
    Button.tsx                    # Shared button primitive
    Card.tsx                      # Shared card wrapper
    ChevronIcon.tsx               # Icon component
    GetStartedLink.tsx            # CTA link
    SignOutButton.tsx              # Sign-out trigger (landing page context)
    ContactFormProvider.tsx       # React context — exposes useContactForm() hook
    ContactPanel.tsx              # Slide-out contact form (auth + unauth variants)
    ContactTriggerLink.tsx        # Inline "use client" trigger for server-rendered pages
    SectionErrorBoundary.tsx      # Error boundary for streaming dashboard sections
  /dashboard                      # Dashboard-specific components
    Sidebar.tsx                   # Desktop sidebar nav
    MobileTopBar.tsx              # Mobile top bar
    MobileDrawer.tsx              # Mobile slide-out drawer nav
    MobileDashboardNav.tsx        # Mobile bottom nav bar
    navItems.tsx                  # Shared nav item definitions (used by Sidebar + Drawer)
    Greeting.tsx                  # User greeting with name
    StartHere.tsx                 # Onboarding progress component
    StartHereSection.tsx          # Suspense wrapper for StartHere
    ContentCards.tsx              # Content tile grid
    ContentCardsSection.tsx       # Suspense wrapper for ContentCards
    ContentGrid.tsx               # Full content grid for tier pages
    CommunitySection.tsx          # Community rules + WhatsApp link
    CommunitySectionWrapper.tsx   # Suspense wrapper for CommunitySection
    AccountStrip.tsx              # Account info strip
    AccountStripSection.tsx       # Suspense wrapper for AccountStrip
    ParentInvitationSection.tsx   # Invite/manage parent flow UI
    ParentInvitationWrapper.tsx   # Suspense wrapper for ParentInvitationSection
    AddonModal.tsx                # Add-on upsell modal
    PdfViewer.tsx                 # react-pdf backed full-screen PDF modal
    SignOutButton.tsx              # Sign-out button (dashboard context)
    skeletons/                    # Loading skeleton components for each Suspense section
  /account
    ProfileSection.tsx            # Profile edit form
    BillingSection.tsx            # Billing info and Stripe portal link
  /admin
    AdminSidebar.tsx              # Admin portal sidebar nav
    AdminStatsSection.tsx         # Stats cards (Suspense)
    RecentSignupsSection.tsx      # Recent signups table (Suspense)
    skeletons/                    # Admin loading skeletons
    UsersTable.tsx                # User management table (client component)
    UserPanel.tsx                 # Slide-out user detail panel
    InvitationLinkForm.tsx        # Manual parent invitation form
    ContentUploadForm.tsx         # PDF upload form
    ContentDeleteButton.tsx       # Individual content delete action
    UserPdfAssignment.tsx         # Per-user PDF assignment UI
    AdminGrantForm.tsx            # Grant admin access form
    AdminRevokeButton.tsx         # Revoke admin button
    DeleteUserModal.tsx           # Two-step soft/hard delete modal
    SettingsForm.tsx              # Settings (WhatsApp link) form
    PricingSection.tsx            # Pricing management UI
    CommunityExportButton.tsx     # CSV export trigger
  /pricing
    BuyNowButton.tsx              # Purchase CTA button

/lib
  supabase.ts                     # DEAD FILE — do not import. Use lib/supabase/* instead.
  /supabase
    client.ts                     # Browser client factory (createBrowserClient, @supabase/ssr)
    server.ts                     # Server client factory (createServerClient, @supabase/ssr)
    service.ts                    # Service role client factory (bypasses RLS)
  stripe.ts                       # Stripe client singleton
  /resend
    client.ts                     # Resend client singleton
    /templates
      contactNotification.ts      # Admin notification email for contact form
      parentInvitation.ts         # Parent invitation email (links to /invite, not magic link)
  /actions                        # Server Actions ("use server")
    signOut.ts                    # signOut() — logs then signs out
    updateProfile.ts              # updateProfile() — diff-based, logs changes
    acceptCommunityRules.ts       # acceptCommunityRules() — inserts agreement row
    trackContentVisit.ts          # trackContentVisit() — idempotent first-visit stamp
    contactForm.ts                # submitContactForm() — inserts + sends Resend notification
    parentInvitation.ts           # sendParentInvitation(), resendParentInvitation(),
                                  # cancelParentInvitation(), unlinkParent(), acceptInvitation()
    /admin
      admins.ts                   # grantAdminAccess(), revokeAdminAccess()
      content.ts                  # uploadContentItem(), deleteContentItem(), etc.
      invitations.ts              # adminLinkParent()
      settings.ts                 # saveWhatsappLink()
      updatePricing.ts            # updatePricing() — diff-based, logs changes
      users.ts                    # setUserMembershipTier(), setUserAddon(),
                                  # softDeleteUser(), hardDeleteUser(), reactivateUser(),
                                  # assignContentToUser(), revokeContentFromUser(), etc.
  /admin
    data.ts                       # fetchAdminOverview(), fetchUsers() — server data functions
    auditLog.ts                   # fetchAuditLog(), ACTION_GROUPS, PAGE_SIZE
  /audit
    actions.ts                    # AuditAction const object + AuditActionType union
    log.ts                        # logAction() — fire-and-forget, never await
    actionBadge.ts                # Badge colour helpers — plain module, no directives
  /config
    brand.ts                      # Centralised brand config — name, tagline, logo, font, colors
    pricing.ts                    # PricingItem, TierId, AddonId, ProductId types only
    getPricing.ts                 # getPricing(), getPublicPricing(), getPricingById() (React.cache)
    productAccents.ts             # Per-product accent mapping for dashboard/admin UI
  /dashboard
    access.ts                     # fetchDashboardAccess() — cached entitlements from user_access view
    content.ts                    # fetchTierContent(), fetchUserDocuments() — cached
  /env
    guard.ts                      # assertNotProduction() — throws if NEXT_PUBLIC_ENVIRONMENT=production
  /pdf
    fetch.ts                      # fetchAndWatermarkPdf() — full pipeline
    watermark.ts                  # watermarkPdf() — stamps email on every page via pdf-lib

/hooks
  useUser.ts                      # useUser() — client-side auth state hook

/types
  index.ts                        # DashboardAccess, User, Entitlement, ProductSlug
  admin.ts                        # AdminUser, ContentItem, ParentInvitationRow, AuditLogRow, etc.

/__tests__                        # Jest tests — mirrors source structure exactly
/docs
  ustart-project-snapshot.md      # Living project snapshot — update on every PR
  staging-setup.md                # Staging environment setup guide
  /supabase-email-templates
    magic-link-staging.html       # Supabase magic-link email template — staging
    magic-link-production.html    # Supabase magic-link email template — production
    confirm-signup-staging.html   # Supabase confirm-signup email template — staging
    confirm-signup-production.html # Supabase confirm-signup email template — production
  /claude                         # Claude Code context sub-files
    architecture.md               # This file
    conventions.md                # TypeScript, component, styling, action conventions
    testing.md                    # Test structure, coverage rules, jest setup
    git.md                        # Branching, commits, PR workflow
  /migrations
    001_initial_schema.sql        # Canonical schema — living file, updated in-place after every change
    README.md                     # Schema change workflow (run on staging → production → update 001)

middleware.ts                     # Edge middleware — route protection + admin guard
next.config.js                    # Next.js config (CommonJS — module.exports)
tailwind.config.ts                # Tailwind config — custom screen, fonts, animations
jest.config.js                    # Jest config (nextJest, jsdom default environment)
jest.setup.ts                     # @testing-library/jest-dom setup
/.github/workflows/ci.yml         # CI — typecheck + lint + test on PRs to develop and main
```

## Design Tokens

The design system is fully light mode. Dark theme tokens and dark-mode overrides have been removed.

| Variable | Value | Usage |
|---|---|---|
| `--bg` | `#F2F1EF` | Page background (creme) |
| `--bg-card` | `#FFFFFF` | Card surfaces |
| `--bg-card-hover` | `#F8F7F5` | Hovered card background |
| `--bg-subtle` | `#ECEAE7` | Subtle backgrounds, locked states |
| `--border` | `rgba(28,43,58,0.10)` | Default borders |
| `--border-md` | `rgba(28,43,58,0.16)` | Medium-emphasis borders |
| `--border-hi` | `rgba(28,43,58,0.24)` | High-emphasis borders |
| `--text` | `#1C2B3A` | Primary text |
| `--text-mid` | `rgba(28,43,58,0.68)` | Mid-emphasis text |
| `--text-muted` | `rgba(28,43,58,0.42)` | Muted text |
| `--accent` | `#3083DC` | Primary interactive blue |
| `--accent-hover` | `#2470C7` | Accent hover state |
| `--destructive` | `#E54B4B` | Destructive actions |

Brand colors live in `lib/config/brand.ts`. Per-product accent colors live in `lib/config/productAccents.ts`.

## Fonts

- `Plus Jakarta Sans` is the single primary font.
- It is loaded via `next/font/google` in `app/layout.tsx` as the CSS variable `--font-primary`.
- Tailwind uses `font-primary` across the app; legacy `font-syne` and `font-dm-sans` utilities were removed.
- To switch to Salmond later, update the font import in `app/layout.tsx`.

---

## Supabase Clients — Which to Use Where

| File | Client | Use for |
|---|---|---|
| `lib/supabase/client.ts` | `createBrowserClient` (@supabase/ssr) | Client Components, hooks |
| `lib/supabase/server.ts` | `createServerClient` (@supabase/ssr) | Server Components, Server Actions, Route Handlers |
| `lib/supabase/service.ts` | `createClient` (@supabase/supabase-js, service role) | Admin operations, bypassing RLS, cross-user queries |
| `lib/supabase.ts` | — | **Dead file. Never import.** |

The service client uses `SUPABASE_SERVICE_ROLE_KEY` and must never be exposed to the browser. All three factories call `assertNotProduction()` as their first line.

---

## Database Tables

| Table | Key Columns | Notes |
|---|---|---|
| `profiles` | id, email, first_name, last_name, phone_number, university_name, country_of_origin, role, student_id, is_admin, is_active, first_content_visit_at | Extends auth.users via handle_new_user trigger |
| `memberships` | user_id, tier, status, purchased_at | One active per user (unique on user_id). tier: lite/pro/premium |
| `one_time_purchases` | user_id, type, status, purchased_at, stripe_payment_intent_id | type: parent_seat. Unique on (user_id, type) |
| `addons` | user_id, type, status, stripe_customer_id, stripe_subscription_id, stripe_product_id, current_period_end | type: explore/concierge. Multiple per user. |
| `parent_invitations` | id, student_id, parent_email, status, invite_token, invite_token_expires_at, invited_at, accepted_at, cancelled_at | Partial unique index: one pending/accepted per student |
| `parent_content` | — | Placeholder — no content yet |
| `community_agreements` | user_id, agreed_at | One row per user when rules accepted |
| `config` | key, value | Key-value store. Currently holds whatsapp_invite_link |
| `content_items` | id, title, description, tier, file_path, file_name, is_individual_only, uploaded_by, created_at, updated_at | tier: lite/pro/premium/parent_pack/explore/concierge |
| `user_content_items` | id, user_id, content_item_id, assigned_by, created_at | Individual PDF assignments. Unique on (user_id, content_item_id) |
| `pricing` | id, name, description, price, billing, features (JSONB), is_public, display_order, stripe_product_id, stripe_price_id, updated_at | Single source of truth for all product pricing |
| `contact_submissions` | id, name, email, message, user_id, created_at | Contact form submissions |
| `audit_logs` | id, created_at, actor_id, actor_email, action, target_id, target_email, payload (JSONB), payload_text (generated) | Immutable event log. payload_text is a stored generated column for ILIKE search |
| `user_access` | (view) | Full access state: has_membership, membership_tier, membership_rank, has_parent_seat, has_explore, has_concierge, has_agreed_to_community, active_addons, etc. |

**Critical column names:**
- `addons.type` and `one_time_purchases.type` — the column is `type`, NOT `product`
- `audit_logs.payload_text` — never set manually, Postgres keeps it in sync with `payload::text`

---

## Key Functions & Views

- `handle_new_user()` — trigger, auto-creates profiles row on every new auth signup
- `tier_rank(tier)` — returns numeric rank (lite=1, pro=2, premium=3)
- `is_parent_of(student_id)` — security definer function used in RLS policies
- `user_access` view — use this for all entitlement checks; never query memberships/addons directly for access decisions

---

## Middleware

Runs on all requests except static files. Matcher: `/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)`.

- `/dashboard`, `/content`, `/admin` — protected; unauthenticated → `/sign-in`
- `/admin` — also requires `profiles.is_admin = true`; non-admin authenticated users → `/dashboard`
- `/invite` — intentionally public (parent confirmation page, no auth)
- `/sign-in` — redirects already-authenticated users to `/dashboard`
- Inactive users (`is_active = false`) are NOT caught by middleware — blocked at auth callback only

---

## Environment Variables

| Variable | Type | Used In | Per-environment |
|---|---|---|---|
| `NEXT_PUBLIC_ENVIRONMENT` | Public | `lib/env/guard.ts` | `local` / `staging` / `production` |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase clients, middleware | Staging URL for local+staging; prod URL for production |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase clients, middleware | Staging key for local+staging; prod key for production |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only | `lib/supabase/service.ts` | Staging key for local+staging; prod key for production |
| `NEXT_PUBLIC_SITE_URL` | Public | `lib/actions/parentInvitation.ts` | `http://localhost:3000` / Vercel preview URL / `https://www.u-start.co.uk` |
| `STRIPE_SECRET_KEY` | Server-only | `lib/stripe.ts` | Test key / test key / live key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Public | `.env.example` | Test key / test key / live key |
| `STRIPE_WEBHOOK_SECRET` | Server-only | `.env.example` | Test secret / test secret / live secret |
| `RESEND_API_KEY` | Server-only | `lib/resend/client.ts` | Scoped to staging.u-start.co.uk / staging.u-start.co.uk / u-start.co.uk |
| `RESEND_FROM_EMAIL` | Server-only | `lib/actions/contactForm.ts`, `lib/actions/admin/invitations.ts` | `hello@staging.u-start.co.uk` / `hello@staging.u-start.co.uk` / `hello@u-start.co.uk` |
| `RESEND_NOTIFICATION_EMAIL` | Server-only | `lib/actions/contactForm.ts` | `rosoti17@apu.edu` / `staging@u-start.co.uk` (not yet active) / `csr@u-start.co.uk` (not yet active) |
| `NEXT_PUBLIC_POSTHOG_KEY` | Public | PostHog | Staging / staging / production key |
| `NEXT_PUBLIC_POSTHOG_HOST` | Public | PostHog | `https://app.posthog.com` (all envs) |

Never commit `.env` or `.env.local`. All secrets live in Vercel environment variables.

---

## Auth Flow

- Magic link only — no passwords. `shouldCreateUser: true` for student sign-in.
- New user → `handle_new_user` trigger → profiles row auto-created.
- Callback (`app/(auth)/auth/callback/route.ts`) exchanges PKCE code, checks `profiles.is_active`, handles parent linking via `user_metadata`.
- Parent invitation: email contains a `/invite?token=UUID` URL (not a magic link). `acceptInvitation()` calls `admin.createUser()` + `signInWithOtp()` — PKCE compatible. This prevents Gmail pre-fetch bots consuming the one-time token.

---

## Branch Model

| Branch | Deploys to | Supabase project |
|---|---|---|
| `main` | Vercel production | Production (`www.u-start.co.uk`) |
| `develop` | Vercel staging preview | Staging (`euipxrmmxigpvxjohloo.supabase.co`) |
| `feature/*` | Local only | — |

All feature branches cut from `develop`. PRs into `develop`, then `develop` → `main` to promote to production.
