-- Allow jury members (anyone whose role is 'jury' OR 'admin' in profiles)
-- to update submission_status on any submission.

-- 1. Create or update an is_jury() helper (non-recursive — SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.is_jury()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE uid = auth.uid() AND role IN ('jury', 'admin')
  );
$$;

-- 2. Add a policy that lets jury/admin update any submission
DROP POLICY IF EXISTS "submissions_update_jury" ON public.submissions;
CREATE POLICY "submissions_update_jury" ON public.submissions
  FOR UPDATE USING (public.is_jury());

-- 3. Promote your designated jury accounts in the profiles table.
--    Run this AFTER each jury member has logged in at least once (so they have a profile row).
UPDATE public.profiles
SET role = 'jury'
WHERE email IN (
  'landarch.org@gmail.com'
  -- add more jury emails here, comma separated
);

-- Verify
SELECT email, role FROM public.profiles WHERE role IN ('jury', 'admin');
