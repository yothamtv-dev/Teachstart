-- Patch 008: Fix infinite recursion on public.users RLS (from patch 006 admin policy)
-- Run in Supabase SQL Editor. Safe to re-run.

-- SECURITY DEFINER reads users without re-entering RLS
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

-- Remove the recursive policy (queries users inside users policy)
DROP POLICY IF EXISTS "Admins can manage all user profiles" ON public.users;

-- Admin access without recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.users;
CREATE POLICY "Admins can view all profiles" ON public.users
  FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.users;
CREATE POLICY "Admins can update all profiles" ON public.users
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
