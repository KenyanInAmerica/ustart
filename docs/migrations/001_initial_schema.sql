-- -----------------------------------------------
-- 001_initial_schema.sql
-- Definitive UStart schema — extracted from production April 10, 2026
-- Supersedes migrations 002–009 which are archived below
-- -----------------------------------------------

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- -----------------------------------------------
-- Tables
-- -----------------------------------------------

CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student',
  student_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  first_content_visit_at TIMESTAMPTZ,
  phone_number TEXT,
  university_name TEXT,
  country_of_origin TEXT,
  arrival_date DATE,
  graduation_date DATE,
  city TEXT,
  intake_completed_at TIMESTAMPTZ,
  first_name TEXT,
  last_name TEXT,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE public.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  tier TEXT NOT NULL,
  billing TEXT NOT NULL DEFAULT 'one-time',
  status TEXT NOT NULL DEFAULT 'active',
  stripe_customer_id TEXT,
  stripe_payment_intent_id TEXT,
  stripe_product_id TEXT,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT memberships_user_id_unique UNIQUE (user_id)
);

CREATE TABLE public.one_time_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  stripe_payment_intent_id TEXT NOT NULL,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT one_time_purchases_user_id_type_unique UNIQUE (user_id, type)
);

CREATE TABLE public.call_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL
    CHECK (type = ANY (ARRAY['arrival_call', 'additional_support_call'])),
  status TEXT NOT NULL DEFAULT 'purchased'
    CHECK (status = ANY (ARRAY['purchased', 'booked', 'completed', 'cancelled'])),
  stripe_payment_intent_id TEXT,
  calendly_event_id TEXT,
  booked_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT NOT NULL,
  stripe_product_id TEXT,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_active_addon UNIQUE (user_id, type)
);

CREATE TABLE public.parent_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  parent_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  invite_token UUID DEFAULT gen_random_uuid() NOT NULL,
  invite_token_expires_at TIMESTAMPTZ,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.parent_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  content_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.community_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  agreed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT community_agreements_user_id_key UNIQUE (user_id)
);

CREATE TABLE public.config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  tier TEXT,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE NO ACTION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_individual_only BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE public.user_content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content_item_id UUID REFERENCES public.content_items(id) ON DELETE CASCADE NOT NULL,
  assigned_by UUID REFERENCES public.profiles(id) ON DELETE NO ACTION,
  CONSTRAINT user_content_items_user_id_content_item_id_key UNIQUE (user_id, content_item_id)
);

CREATE TABLE public.pricing (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  billing TEXT NOT NULL,
  features JSONB,
  is_public BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

CREATE TABLE public.plan_task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  days_from_arrival INTEGER NOT NULL DEFAULT 0,
  content_url TEXT,
  tier_required TEXT NOT NULL DEFAULT 'lite',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT plan_task_templates_phase_check CHECK (
    phase = ANY (ARRAY['before_arrival', 'first_7_days', 'settling_in', 'ongoing_support'])
  ),
  CONSTRAINT plan_task_templates_tier_check CHECK (
    tier_required = ANY (ARRAY['lite', 'explore', 'concierge'])
  ),
  CONSTRAINT plan_task_templates_display_order_check CHECK (
    display_order >= 0
  )
);

-- Query convention for ordered template reads:
-- ORDER BY phase, display_order, created_at
-- created_at is the secondary tiebreaker when display_order values are equal.

CREATE TABLE public.plan_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  template_id UUID REFERENCES public.plan_task_templates(id) ON DELETE SET NULL,
  phase TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'not_started',
  content_url TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT plan_tasks_phase_check CHECK (
    phase = ANY (ARRAY['before_arrival', 'first_7_days', 'settling_in', 'ongoing_support'])
  ),
  CONSTRAINT plan_tasks_status_check CHECK (
    status = ANY (ARRAY['not_started', 'in_progress', 'completed'])
  ),
  CONSTRAINT plan_tasks_display_order_check CHECK (
    display_order >= 0
  )
);

-- Query convention for ordered plan reads:
-- ORDER BY phase, display_order, created_at
-- created_at is the secondary tiebreaker when display_order values are equal.

CREATE TABLE public.intake_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  responses JSONB NOT NULL DEFAULT '{}'::jsonb,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT intake_responses_user_id_key UNIQUE (user_id)
);

-- -----------------------------------------------
-- Foreign key added after profiles exists
-- -----------------------------------------------

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.memberships
  ADD CONSTRAINT memberships_tier_check
  CHECK (tier = ANY (ARRAY['lite', 'explore', 'concierge']));

ALTER TABLE public.addons
  ADD CONSTRAINT addons_type_check
  CHECK (type = ANY (ARRAY['arrival_call', 'additional_support_call']));

ALTER TABLE public.one_time_purchases
  ADD CONSTRAINT one_time_purchases_type_check
  CHECK (type = ANY (ARRAY['parent_seat']));

-- -----------------------------------------------
-- Functions
-- -----------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'student');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.tier_rank(tier TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN CASE tier
    WHEN 'lite'      THEN 1
    WHEN 'explore'   THEN 2
    WHEN 'concierge' THEN 3
    ELSE 0
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.is_parent_of(student_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'parent'
      AND profiles.student_id = is_parent_of.student_id
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- -----------------------------------------------
-- Triggers
-- -----------------------------------------------

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER handle_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_memberships
  BEFORE UPDATE ON public.memberships
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_addons
  BEFORE UPDATE ON public.addons
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_one_time_purchases
  BEFORE UPDATE ON public.one_time_purchases
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_call_bookings
  BEFORE UPDATE ON public.call_bookings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_parent_invitations
  BEFORE UPDATE ON public.parent_invitations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_plan_task_templates
  BEFORE UPDATE ON public.plan_task_templates
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_plan_tasks
  BEFORE UPDATE ON public.plan_tasks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- -----------------------------------------------
-- Views
-- -----------------------------------------------

CREATE VIEW public.user_access AS
SELECT
  p.id,
  p.email,
  p.first_name,
  p.last_name,
  p.role,
  p.student_id,
  p.first_content_visit_at,
  p.phone_number,
  p.university_name,
  p.country_of_origin,
  m.tier AS membership_tier,
  m.status AS membership_status,
  m.purchased_at AS membership_purchased_at,
  tier_rank(m.tier) AS membership_rank,
  COALESCE(
    json_agg(
      json_build_object(
        'type', a.type,
        'status', a.status,
        'current_period_end', a.current_period_end,
        'cancel_at_period_end', a.cancel_at_period_end
      )
    ) FILTER (WHERE a.id IS NOT NULL AND a.status = 'active'),
    '[]'::json
  ) AS active_addons,
  ((m.id IS NOT NULL) AND (m.status = 'active')) AS has_membership,
  (EXISTS (
    SELECT 1 FROM one_time_purchases otp
    WHERE otp.user_id = p.id AND otp.type = 'parent_seat' AND otp.status = 'active'
  )) AS has_parent_seat,
  (tier_rank(m.tier) >= 2) AS has_explore,
  (tier_rank(m.tier) >= 3) AS has_concierge,
  (EXISTS (
    SELECT 1 FROM community_agreements ca
    WHERE ca.user_id = p.id
  )) AS has_agreed_to_community,
  pi.parent_email AS invited_parent_email,
  pi.status AS parent_invitation_status,
  pi.accepted_at AS parent_invitation_accepted_at
FROM profiles p
LEFT JOIN memberships m ON m.user_id = p.id AND m.status = 'active'
LEFT JOIN addons a ON a.user_id = p.id
LEFT JOIN parent_invitations pi ON pi.student_id = p.id AND pi.status = ANY(ARRAY['pending', 'accepted'])
GROUP BY
  p.id, p.email, p.first_name, p.last_name, p.role, p.student_id,
  p.first_content_visit_at, p.phone_number, p.university_name, p.country_of_origin,
  m.id, m.tier, m.status, m.purchased_at,
  pi.parent_email, pi.status, pi.accepted_at;

-- -----------------------------------------------
-- Indexes
-- -----------------------------------------------

CREATE UNIQUE INDEX one_active_invite_per_student
  ON public.parent_invitations (student_id)
  WHERE status IN ('pending', 'accepted');

CREATE UNIQUE INDEX parent_invitations_invite_token_idx
  ON public.parent_invitations (invite_token);

CREATE INDEX call_bookings_user_id_idx
  ON public.call_bookings (user_id);

CREATE INDEX audit_logs_created_at_idx ON public.audit_logs (created_at DESC);
CREATE INDEX audit_logs_actor_id_idx ON public.audit_logs (actor_id);
CREATE INDEX audit_logs_action_idx ON public.audit_logs (action);

ALTER TABLE public.audit_logs
  ADD COLUMN payload_text TEXT GENERATED ALWAYS AS (payload::text) STORED;

CREATE INDEX audit_logs_payload_text_trgm_idx
  ON public.audit_logs USING gin (payload_text gin_trgm_ops);

-- -----------------------------------------------
-- RLS
-- -----------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.one_time_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intake_responses ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Parents can view their linked student profile"
  ON public.profiles FOR SELECT
  USING (is_parent_of(id));

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

-- Memberships
CREATE POLICY "Users can view their own memberships"
  ON public.memberships FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Parents can view their student's membership"
  ON public.memberships FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'parent'
        AND p.student_id = memberships.user_id
    )
  );

-- One time purchases
CREATE POLICY "Users can view their own one time purchases"
  ON public.one_time_purchases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own call bookings"
  ON public.call_bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own call bookings"
  ON public.call_bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Addons
CREATE POLICY "Users can view their own add-ons"
  ON public.addons FOR SELECT
  USING (auth.uid() = user_id);

-- Parent invitations
CREATE POLICY "Students can manage their own invitations"
  ON public.parent_invitations FOR ALL
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

-- Parent content
CREATE POLICY "Parents can view published parent content"
  ON public.parent_content FOR SELECT
  USING (
    is_published = true AND
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'parent'
    )
  );

-- Community agreements
CREATE POLICY "Users can view their own agreement"
  ON public.community_agreements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own agreement"
  ON public.community_agreements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Config
CREATE POLICY "Authenticated users can read config"
  ON public.config FOR SELECT
  USING (auth.role() = 'authenticated');

-- Content items
CREATE POLICY "Users can view tier content"
  ON public.content_items FOR SELECT
  USING (
    is_individual_only = false AND
    EXISTS (
      SELECT 1 FROM user_access
      WHERE user_access.id = auth.uid()
        AND (
          (content_items.tier = 'lite'        AND user_access.membership_rank >= 1) OR
          (content_items.tier = 'explore'     AND user_access.membership_rank >= 2) OR
          (content_items.tier = 'concierge'   AND user_access.membership_rank >= 3) OR
          (content_items.tier = 'parent_pack' AND user_access.has_parent_seat = true)
        )
    )
  );

-- User content items
CREATE POLICY "Users can view their own content assignments"
  ON public.user_content_items FOR SELECT
  USING (user_id = auth.uid());

-- Pricing
CREATE POLICY "Anyone can view pricing"
  ON public.pricing FOR SELECT
  USING (true);

-- Contact submissions
CREATE POLICY "Anyone can submit contact form"
  ON public.contact_submissions FOR INSERT
  WITH CHECK (true);

-- Audit logs
CREATE POLICY "Admins can read audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Authenticated users can read templates"
  ON public.plan_task_templates FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage their own tasks"
  ON public.plan_tasks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admin cross-user reads for plan tasks intentionally stay in service-client
-- server code instead of widening RLS with an extra admin-read policy here.

CREATE POLICY "Users can manage their own intake"
  ON public.intake_responses FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- -----------------------------------------------
-- Seed data
-- -----------------------------------------------

INSERT INTO public.pricing (id, name, description, price, billing, features, is_public, display_order, stripe_product_id, stripe_price_id)
VALUES
  ('lite', 'Lite', 'placeholder', 49, 'one-time', '[]', true, 1, 'prod_placeholder', 'price_placeholder'),
  ('explore', 'Explore', 'placeholder', 9.99, 'monthly', '[]', true, 2, 'prod_placeholder', 'price_placeholder'),
  ('concierge', 'Concierge', 'placeholder', 19.99, 'monthly', '[]', true, 3, 'prod_placeholder', 'price_placeholder'),
  ('parent_pack', 'Parent Pack', 'placeholder', 29, 'one-time', '[]', false, 4, 'prod_placeholder', 'price_placeholder'),
  ('arrival_call', '1:1 Arrival Call', 'placeholder', 0.00, 'one-time', '[]', false, 7, 'prod_placeholder', 'price_placeholder'),
  ('additional_support_call', 'Additional Support Call', 'placeholder', 0.00, 'one-time', '[]', false, 8, 'prod_placeholder', 'price_placeholder');

INSERT INTO public.config (key, value)
VALUES ('whatsapp_invite_link', 'https://chat.whatsapp.com/placeholder');
