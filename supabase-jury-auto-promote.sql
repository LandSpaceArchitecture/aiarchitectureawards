-- Auto-promote jury: any user whose email is in jury_whitelist
-- is automatically given role='jury' when their profile is created/updated.
-- Run this once in Supabase SQL Editor.

-- 1. Whitelist table
CREATE TABLE IF NOT EXISTS public.jury_whitelist (
  email text PRIMARY KEY,
  added_at timestamptz DEFAULT now()
);

-- 2. Seed current jurors + test account
INSERT INTO public.jury_whitelist (email) VALUES
  ('rada@dalevadesign.com'),
  ('josh.vermillion@unlv.edu'),
  ('info@thearchart.com'),
  ('aashari@uoguelph.ca'),
  ('mattperotto@gmail.com'),
  ('dh840104@gmail.com'),
  ('kajetan.szostok@mcstudiosx.com'),
  ('landspace.arch@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- 3. Trigger function: auto-set role='jury' on insert/update if email in whitelist
CREATE OR REPLACE FUNCTION public.auto_promote_jury()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM 'admin'
     AND EXISTS (SELECT 1 FROM public.jury_whitelist WHERE email = NEW.email) THEN
    NEW.role := 'jury';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_promote_jury_trigger ON public.profiles;
CREATE TRIGGER auto_promote_jury_trigger
  BEFORE INSERT OR UPDATE OF email ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_promote_jury();

-- 4. Backfill: fix any existing users who are in whitelist but not yet jury
UPDATE public.profiles p
SET role = 'jury'
FROM public.jury_whitelist w
WHERE p.email = w.email AND p.role NOT IN ('jury', 'admin');

-- 5. Verify: list all whitelisted users and their current role
SELECT
  w.email,
  p.role AS current_role,
  CASE WHEN p.uid IS NULL THEN 'not yet logged in' ELSE 'logged in' END AS login_status,
  p.created_at AS profile_created_at
FROM public.jury_whitelist w
LEFT JOIN public.profiles p ON p.email = w.email
ORDER BY w.email;
