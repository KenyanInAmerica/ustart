# UStart — Staging Environment Setup

This document covers everything needed to configure a new staging environment from scratch: Supabase project, Vercel environment variables, and GitHub secrets. Follow the steps in order.

---

## Overview

| Environment | Branch  | Supabase Project  | Vercel Environment |
| ----------- | ------- | ----------------- | ------------------ |
| Local dev   | any     | staging           | n/a (localhost)    |
| Staging     | develop | ustart-staging    | Preview (develop)  |
| Production  | main    | ustart-production | Production         |

Local developers always point at the staging Supabase project. Production credentials are never used outside Vercel's production environment.

---

## Step 1 — Create the staging Supabase project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Name it `ustart-staging`
3. Choose the same region as the production project
4. Save the database password somewhere secure — you will not see it again

Once the project is created, note down:
- **Project URL** — shown in Settings → API (e.g. `https://xxxx.supabase.co`)
- **Anon / public key** — shown in Settings → API
- **Service role key** — shown in Settings → API (keep this secret)

---

## Step 2 — Apply the schema to staging

Apply all schema components in the following order via **Supabase dashboard → SQL Editor**.

### 2a — Base schema

Paste and run the contents of `references/ustart-schema-v3.sql`. This creates all core tables, RLS policies, triggers, and functions.

### 2b — Migrations applied since v3 (apply in order)

**Migration 1 — Fix one_time_purchases FK reference**
```sql
ALTER TABLE public.one_time_purchases
  DROP CONSTRAINT one_time_purchases_user_id_fkey;
ALTER TABLE public.one_time_purchases
  ADD CONSTRAINT one_time_purchases_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
```

**Migration 2 — Drop no-op function**
```sql
DROP FUNCTION IF EXISTS public.tier_includes_parent_seat(text);
```

**Migration 3 — Add is_active to profiles**
```sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
```

**Migration 4 — Add contact_submissions table**
```sql
CREATE TABLE public.contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own contact submissions"
  ON public.contact_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can read contact submissions"
  ON public.contact_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );
```

**Migration 5 — Add audit_logs table**
```sql
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email TEXT,
  action TEXT NOT NULL,
  target_id UUID,
  target_email TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read audit logs"
  ON public.audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );

CREATE INDEX audit_logs_created_at_idx ON public.audit_logs (created_at DESC);
CREATE INDEX audit_logs_actor_id_idx ON public.audit_logs (actor_id);
CREATE INDEX audit_logs_action_idx ON public.audit_logs (action);
```

**Migration 6 — Add payload_text generated column and GIN index**
```sql
ALTER TABLE audit_logs
  ADD COLUMN payload_text TEXT GENERATED ALWAYS AS (payload::text) STORED;

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX audit_logs_payload_text_trgm_idx
  ON audit_logs USING gin (payload_text gin_trgm_ops);
```

### 2c — Seed pricing data

```sql
-- Insert pricing rows matching production values.
-- Refer to the snapshot Pricing Configuration section for descriptions and features.
-- stripe_product_id and stripe_price_id are left as placeholders until Feature 12.

INSERT INTO public.pricing (id, name, description, price, billing, features, is_public, display_order, stripe_product_id, stripe_price_id)
VALUES
  ('lite', 'Lite', 'Core content library', 49, 'one-time', '[]', TRUE, 1, 'prod_placeholder', 'price_placeholder'),
  ('explore', 'Explore', 'Deeper guidance membership', 9.99, 'monthly', '[]', TRUE, 2, 'prod_placeholder', 'price_placeholder'),
  ('concierge', 'Concierge', 'Highest-touch membership', 19.99, 'monthly', '[]', TRUE, 3, 'prod_placeholder', 'price_placeholder'),
  ('parent_pack', 'Parent Pack', 'Parent access', 29, 'one-time', '[]', FALSE, 4, 'prod_placeholder', 'price_placeholder'),
  ('arrival_call', '1:1 Arrival Call', 'Arrival support add-on', 0.00, 'one-time', '[]', FALSE, 7, 'prod_placeholder', 'price_placeholder'),
  ('additional_support_call', 'Additional Support Call', 'Extra support add-on', 0.00, 'one-time', '[]', FALSE, 8, 'prod_placeholder', 'price_placeholder')
ON CONFLICT (id) DO NOTHING;
```

Update each row's `description` and `features` JSONB to match the current production values before using staging for QA.

---

## Step 3 — Configure staging Supabase auth settings

In the staging Supabase dashboard → **Authentication → URL Configuration**:

| Setting        | Value                                                                                           |
| -------------- | ----------------------------------------------------------------------------------------------- |
| Site URL       | `http://localhost:3000`                                                                         |
| Redirect URLs  | `http://localhost:3000/auth/callback` and `https://<staging-vercel-url>.vercel.app/auth/callback` |

In **Authentication → Email Templates**:
- Apply the same branded magic link template from `references/ustart-magic-link-email.html`
- Apply the same confirm signup template

---

## Step 4 — Create the pdfs storage bucket in staging

1. Supabase dashboard → **Storage → New bucket**
2. Name: `pdfs`
3. Public: **No** (private bucket)
4. Apply the same RLS policies as production (check the SQL Editor → Storage policies if unsure)

---

## Step 5 — Configure Vercel environments

### 5a — Staging (Preview — develop branch only)

1. Vercel → project → **Settings → Environment Variables**
2. For each variable below, set the Environment to **Preview** and scope it to the `develop` branch specifically

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_ENVIRONMENT` | `staging` |
| `NEXT_PUBLIC_SUPABASE_URL` | Staging Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Staging anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Staging service role key |
| `NEXT_PUBLIC_SITE_URL` | The Vercel preview URL for the develop branch |
| `RESEND_API_KEY` | Staging Resend key (or same key with test mode) |
| `RESEND_FROM_EMAIL` | Staging from address |
| `RESEND_NOTIFICATION_EMAIL` | Your admin email for staging notifications |
| `NEXT_PUBLIC_POSTHOG_KEY` | Staging PostHog key (or same key — separate project preferred) |
| `NEXT_PUBLIC_POSTHOG_HOST` | `https://app.posthog.com` |

To scope a variable to a specific branch in Vercel: when adding the variable, select **Preview** as the environment, then click **Add** → you will see an option to restrict to a specific Git branch — enter `develop`.

### 5b — Production (main branch)

1. Vercel → project → **Settings → Environment Variables → Production**
2. Ensure all variables point at the production Supabase project

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_ENVIRONMENT` | `production` |
| `NEXT_PUBLIC_SUPABASE_URL` | Production Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Production service role key |
| `NEXT_PUBLIC_SITE_URL` | `https://yourdomain.com` |
| `RESEND_API_KEY` | Production Resend key |
| `RESEND_FROM_EMAIL` | Production from address |
| `RESEND_NOTIFICATION_EMAIL` | Production admin notification email |
| `NEXT_PUBLIC_POSTHOG_KEY` | Production PostHog key |
| `NEXT_PUBLIC_POSTHOG_HOST` | `https://app.posthog.com` |

**Production credentials must never appear outside Vercel's production environment settings.** Do not put them in `.env.local`, GitHub secrets, or any other location.

---

## Step 6 — Add GitHub Actions secrets

The CI workflow (`.github/workflows/ci.yml`) runs tests against the staging Supabase project. Add the following secrets in **GitHub → repository → Settings → Secrets and variables → Actions → New repository secret**:

| Secret name | Value |
|---|---|
| `STAGING_SUPABASE_URL` | Staging Supabase project URL |
| `STAGING_SUPABASE_ANON_KEY` | Staging anon key |
| `STAGING_SERVICE_ROLE_KEY` | Staging service role key |

These are the same values as the Vercel staging environment variables. The CI workflow references them as `${{ secrets.STAGING_SUPABASE_URL }}` etc.

---

## Step 7 — Verify the setup

Once everything above is complete, verify each environment:

**Local dev**
```bash
# .env.local should contain NEXT_PUBLIC_ENVIRONMENT=local and staging Supabase credentials
npm run dev
# Visit http://localhost:3000 — confirm staging Supabase is connected (sign up creates a user in staging)
```

**Staging**
1. Open a PR from any `feature/*` branch into `develop`
2. GitHub Actions CI should run typecheck, lint, and test — all must pass
3. Merge the PR — Vercel should deploy a preview build scoped to the `develop` branch
4. Visit the Vercel preview URL — confirm it connects to staging Supabase

**Production**
1. Open a PR from `develop` into `main`
2. CI must pass before merge is allowed
3. Merge — Vercel deploys to production
4. Confirm the production URL connects to the production Supabase project

---

## Branch and PR model

```
feature/xyz  →  develop  →  main
               (staging)   (production)
```

- All feature work branches off `develop`
- Feature PRs merge into `develop` (CI required)
- `develop` → `main` PRs promote staging to production (CI required)
- Direct pushes to `develop` and `main` are blocked by branch protection

---

## Known Limitations & Developer Notes

### Supabase Site URL and Local Development

Supabase generates magic link emails using the **Site URL** as the base for `{{ .ConfirmationURL }}`, regardless of the `emailRedirectTo` value passed in `signInWithOtp()`. This means:

- If Site URL is set to `http://localhost:3000`, magic links will point to localhost even when requested from the staging Vercel deployment
- If Site URL is set to the staging Vercel URL, magic links will point to staging even when signing in locally

**Current configuration:**

The staging Supabase Site URL is set to `https://ustart-git-develop-randy-osotis-projects.vercel.app`. This means local development magic links will redirect to staging.

**Workaround for local development:**

When signing in locally, the magic link email will contain a staging URL. Replace the domain in the link manually:

```
# Received in email:
https://ustart-git-develop-randy-osotis-projects.vercel.app/auth/callback?code=xxx

# Change to:
http://localhost:3000/auth/callback?code=xxx
```

**Permanent fix (post-launch):**

Set up a local Supabase instance via the Supabase CLI so local dev has its own auth configuration independent of staging. This is deferred to post-launch.

**Production:**

Before launch, update the production Supabase project Site URL to the production domain. The staging Supabase Site URL remains pointing at the staging Vercel URL.

---

## Things to watch

- The `payload_text` generated column (Migration 6) must be applied **before** deploying any build that references it. If missing, audit log search silently returns empty results.
- Staging Supabase auth redirect URLs must include both `localhost:3000/auth/callback` and the Vercel preview URL's `/auth/callback` — magic links will fail if the redirect URL is not whitelisted.
- Vercel preview deployments for branches other than `develop` (e.g. `feature/*`) will not have staging env vars scoped to them — they will use whatever default Preview vars are set. Those deployments are not intended for QA use; only the `develop` preview is the official staging environment.
