-- Patch 006: Pro subscription tier for AI feature gating
-- Run in Supabase SQL editor. Safe to re-run.
-- If you see "infinite recursion" on users, also run 008-fix-users-rls-recursion.sql

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT NOT NULL DEFAULT 'free';

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS subscription_status TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_subscription_tier_check'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_subscription_tier_check CHECK (subscription_tier IN ('free', 'pro'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON public.users(subscription_tier);

-- Helper for admin RLS (avoids infinite recursion — do NOT query users inside a users policy)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon, service_role;

DROP POLICY IF EXISTS "Admins can manage all user profiles" ON public.users;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.users;
CREATE POLICY "Admins can view all profiles" ON public.users
  FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.users;
CREATE POLICY "Admins can update all profiles" ON public.users
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
