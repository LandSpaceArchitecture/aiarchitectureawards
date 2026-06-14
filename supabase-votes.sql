-- Jury voting system: each jury member can vote for or against any submission once.
-- Toggle works as: insert = vote, delete = unvote.

-- 0. Ensure is_jury() helper exists (creates if missing).
--    Treats anyone with role 'jury' or 'admin' in profiles as a jury member.
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

-- 0b. Make sure your jury accounts have role='jury' in profiles.
--     Run this AFTER each jury has logged in once.
UPDATE public.profiles
SET role = 'jury'
WHERE email IN (
  'landarch.org@gmail.com'
  -- add more jury emails here
) AND role <> 'admin';  -- don't downgrade admins

-- 1. Votes table
CREATE TABLE IF NOT EXISTS public.votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  voter_uid uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  voter_email text,
  voter_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (submission_id, voter_uid)  -- one vote per jury per project
);

CREATE INDEX IF NOT EXISTS votes_submission_id_idx ON public.votes (submission_id);
CREATE INDEX IF NOT EXISTS votes_voter_uid_idx ON public.votes (voter_uid);

ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- 2. Policies — drop & recreate so this script is idempotent
DROP POLICY IF EXISTS "votes_select_jury_admin" ON public.votes;
DROP POLICY IF EXISTS "votes_insert_jury" ON public.votes;
DROP POLICY IF EXISTS "votes_delete_own" ON public.votes;

-- Anyone authenticated as jury/admin can SEE all votes (for counts + admin overview)
CREATE POLICY "votes_select_jury_admin" ON public.votes
  FOR SELECT USING (public.is_jury());

-- A jury member can INSERT only their own vote
CREATE POLICY "votes_insert_jury" ON public.votes
  FOR INSERT WITH CHECK (
    public.is_jury() AND voter_uid = auth.uid()
  );

-- A jury member can DELETE only their own vote
CREATE POLICY "votes_delete_own" ON public.votes
  FOR DELETE USING (voter_uid = auth.uid());

-- 3. Verify
SELECT 'votes table ready' AS status,
       (SELECT COUNT(*) FROM public.votes) AS current_votes;
