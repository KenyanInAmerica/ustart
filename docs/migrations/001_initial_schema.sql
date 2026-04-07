-- -----------------------------------------------
-- 001_initial_schema.sql
-- Full initial schema through Feature 11
-- -----------------------------------------------

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------
-- Tables
-- -----------------------------------------------

CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role = ANY (ARRAY['student', 'parent'])),
  student_id UUID,
  phone_number TEXT,
  university_name TEXT,
  country_of_origin TEXT,
  first_content_visit_at TIMESTAMPTZ,
  is_admin BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE public.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  tier TEXT NOT NULL CHECK (tier = ANY (ARRAY['lite', 'pro', 'premium'])),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status = ANY (ARRAY['active', 'upgraded', 'revoked'])),
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.one_time_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type = 'parent_seat'),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status = ANY (ARRAY['active', 'refunded'])),
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, type)
);

CREATE TABLE public.addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type = ANY (ARRAY['explore', 'concierge'])),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status = ANY (ARRAY['active', 'cancelled'])),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_product_id TEXT,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.parent_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  parent_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status = ANY (ARRAY['pending', 'accepted', 'cancelled'])),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.parent_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.community_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  agreed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.config (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE public.content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  tier TEXT NOT NULL CHECK (tier = ANY (ARRAY['lite', 'pro', 'premium', 'parent_pack', 'explore', 'concierge'])),
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  is_individual_only BOOLEAN NOT NULL DEFAULT false,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.user_content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content_item_id UUID REFERENCES public.content_items(id) ON DELETE CASCADE NOT NULL,
  assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, content_item_id)
);

CREATE TABLE public.pricing (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  billing TEXT NOT NULL CHECK (billing = ANY (ARRAY['one-time', 'monthly', 'yearly'])),
  features JSONB NOT NULL DEFAULT '[]',
  is_public BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------
-- Foreign key added after profiles exists
-- -----------------------------------------------

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- -----------------------------------------------
-- Functions
-- -----------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.tier_rank(tier TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN CASE tier
    WHEN 'lite' THEN 1
    WHEN 'pro' THEN 2
    WHEN 'premium' THEN 3
    ELSE 0
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- No-op function — dropped in 002_pre_launch_cleanup.sql
CREATE OR REPLACE FUNCTION public.tier_includes_parent_seat(tier TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN false;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.is_parent_of(student_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND profiles.student_id = is_parent_of.student_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------
-- Triggers
-- -----------------------------------------------

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------
-- Views
-- -----------------------------------------------

CREATE OR REPLACE VIEW public.user_access AS
SELECT
  p.id,
  p.first_name,
  p.last_name,
  p.phone_number,
  p.university_name,
  p.country_of_origin,
  p.first_content_visit_at,
  CASE WHEN m.id IS NOT NULL THEN true ELSE false END AS has_membership,
  m.tier AS membership_tier,
  public.tier_rank(m.tier) AS membership_rank,
  CASE WHEN otp.id IS NOT NULL THEN true ELSE false END AS has_parent_seat,
  CASE WHEN a_explore.id IS NOT NULL THEN true ELSE false END AS has_explore,
  CASE WHEN a_concierge.id IS NOT NULL THEN true ELSE false END AS has_concierge,
  ARRAY_REMOVE(ARRAY[
    CASE WHEN a_explore.id IS NOT NULL THEN 'explore' END,
    CASE WHEN a_concierge.id IS NOT NULL THEN 'concierge' END
  ], NULL) AS active_addons,
  CASE WHEN ca.id IS NOT NULL THEN true ELSE false END AS has_agreed_to_community,
  pi.parent_email AS invited_parent_email,
  pi.status AS parent_invitation_status,
  pi.updated_at AS parent_invitation_accepted_at
FROM public.profiles p
LEFT JOIN public.memberships m
  ON m.user_id = p.id AND m.status = 'active'
LEFT JOIN public.one_time_purchases otp
  ON otp.user_id = p.id AND otp.type = 'parent_seat' AND otp.status = 'active'
LEFT JOIN public.addons a_explore
  ON a_explore.user_id = p.id AND a_explore.type = 'explore' AND a_explore.status = 'active'
LEFT JOIN public.addons a_concierge
  ON a_concierge.user_id = p.id AND a_concierge.type = 'concierge' AND a_concierge.status = 'active'
LEFT JOIN public.community_agreements ca
  ON ca.user_id = p.id
LEFT JOIN public.parent_invitations pi
  ON pi.student_id = p.id AND pi.status IN ('pending', 'accepted');

-- -----------------------------------------------
-- Indexes
-- -----------------------------------------------

CREATE UNIQUE INDEX one_active_invite_per_student
  ON public.parent_invitations (student_id)
  WHERE status IN ('pending', 'accepted');

-- -----------------------------------------------
-- RLS policies
-- -----------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.one_time_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Memberships
CREATE POLICY "Users can view own membership"
  ON public.memberships FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all memberships"
  ON public.memberships FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- One time purchases
CREATE POLICY "Users can view own purchases"
  ON public.one_time_purchases FOR SELECT
  USING (auth.uid() = user_id);

-- Addons
CREATE POLICY "Users can view own addons"
  ON public.addons FOR SELECT
  USING (auth.uid() = user_id);

-- Parent invitations
CREATE POLICY "Students can view own invitations"
  ON public.parent_invitations FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Parents can view invitations they are linked to"
  ON public.parent_invitations FOR SELECT
  USING (public.is_parent_of(student_id));

-- Community agreements
CREATE POLICY "Users can view own agreement"
  ON public.community_agreements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own agreement"
  ON public.community_agreements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Config
CREATE POLICY "Authenticated users can read config"
  ON public.config FOR SELECT
  USING (auth.role() = 'authenticated');

-- Content items
CREATE POLICY "Authenticated users can view content"
  ON public.content_items FOR SELECT
  USING (auth.role() = 'authenticated');

-- User content items
CREATE POLICY "Users can view own assigned content"
  ON public.user_content_items FOR SELECT
  USING (auth.uid() = user_id);

-- Pricing
CREATE POLICY "Anyone can view public pricing"
  ON public.pricing FOR SELECT
  USING (true);

-- -----------------------------------------------
-- Seed data
-- -----------------------------------------------

INSERT INTO public.pricing (id, name, description, price, billing, features, is_public, display_order, stripe_product_id, stripe_price_id)
VALUES
  ('lite', 'Lite', 'placeholder', 49, 'one-time', '[]', true, 1, 'prod_placeholder', 'price_placeholder'),
  ('pro', 'Pro', 'placeholder', 99, 'one-time', '[]', true, 2, 'prod_placeholder', 'price_placeholder'),
  ('premium', 'Premium', 'placeholder', 149, 'one-time', '[]', true, 3, 'prod_placeholder', 'price_placeholder'),
  ('parent_pack', 'Parent Pack', 'placeholder', 29, 'one-time', '[]', false, 4, 'prod_placeholder', 'price_placeholder'),
  ('explore', 'Explore', 'placeholder', 9.99, 'monthly', '[]', false, 5, 'prod_placeholder', 'price_placeholder'),
  ('concierge', 'Concierge', 'placeholder', 19.99, 'monthly', '[]', false, 6, 'prod_placeholder', 'price_placeholder');

INSERT INTO public.config (key, value)
VALUES ('whatsapp_invite_link', 'https://chat.whatsapp.com/placeholder');