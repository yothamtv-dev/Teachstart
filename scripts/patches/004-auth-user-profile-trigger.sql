-- Keeps public.users in sync with auth.users on every new signup (including email-confirmation flow
-- where the client has no JWT yet, so RLS blocks a browser-side profile insert).
--
-- If Auth shows "Database error saving new user", open Supabase → Logs → Postgres (or run the trigger
-- function manually) to see the real error. Common causes:
--   • `role` column missing on public.users (fixed below)
--   • `school_name` / other columns missing on your fork of the schema
--   • Trigger uses EXECUTE FUNCTION but your Postgres build expects EXECUTE PROCEDURE (swap line below)

-- App + trigger expect `role` on public.users (patch 002 also adds this + a CHECK).
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'teacher';

-- Trigger writes these; ensure they exist on minimal / older schemas
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS school_name TEXT;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  meta_role text := COALESCE(NEW.raw_user_meta_data->>'role', 'teacher');
BEGIN
  IF meta_role NOT IN ('teacher', 'student', 'admin') THEN
    meta_role := 'teacher';
  END IF;

  INSERT INTO public.users (id, email, full_name, school_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'school_name'), ''),
    meta_role
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
    school_name = COALESCE(EXCLUDED.school_name, public.users.school_name),
    role = CASE
      WHEN EXCLUDED.role IN ('teacher', 'student', 'admin') THEN EXCLUDED.role
      ELSE public.users.role
    END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Use exactly one of the following, depending on your Postgres version:
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();

-- If the line above fails with a syntax error, try instead:
--   EXECUTE FUNCTION public.handle_new_user();

-- Optional one-time backfill for accounts in auth.users with no public.users row:
-- INSERT INTO public.users (id, email, full_name, school_name, role)
-- SELECT
--   au.id,
--   COALESCE(au.email, ''),
--   NULLIF(TRIM(au.raw_user_meta_data->>'full_name'), ''),
--   NULLIF(TRIM(au.raw_user_meta_data->>'school_name'), ''),
--   CASE
--     WHEN au.raw_user_meta_data->>'role' IN ('teacher', 'student', 'admin')
--     THEN au.raw_user_meta_data->>'role'
--     ELSE 'teacher'
--   END
-- FROM auth.users au
-- WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = au.id);
