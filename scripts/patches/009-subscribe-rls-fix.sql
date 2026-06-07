-- Patch 009: Let signed-in users upsert/update their own profile (required for Subscribe to Pro)
-- Run after 006 and 008. Safe to re-run.

DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can create their own profile" ON public.users;
CREATE POLICY "Users can create their own profile" ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Upsert = INSERT or UPDATE; both need to pass for ON CONFLICT DO UPDATE
DROP POLICY IF EXISTS "Users can upsert their own profile" ON public.users;
CREATE POLICY "Users can upsert their own profile" ON public.users
  FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
