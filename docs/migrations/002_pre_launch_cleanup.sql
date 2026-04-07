-- Fix inconsistent FK reference on one_time_purchases (SCHEMA-004)
ALTER TABLE public.one_time_purchases
  DROP CONSTRAINT one_time_purchases_user_id_fkey;

ALTER TABLE public.one_time_purchases
  ADD CONSTRAINT one_time_purchases_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Remove no-op function
DROP FUNCTION IF EXISTS public.tier_includes_parent_seat(text);