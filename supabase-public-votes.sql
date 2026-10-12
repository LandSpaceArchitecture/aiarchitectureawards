-- Public (people's choice) voting system.
-- Separate from jury votes so results don't mix.
-- One vote per logged-in user per submission; toggle via insert/delete.
-- Open to any authenticated user; closes automatically at Oct 19, 2026 23:59 UTC.

-- 1. Table
CREATE TABLE IF NOT EXISTS public.public_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  voter_uid uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  voter_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (submission_id, voter_uid)
);

CREATE INDEX IF NOT EXISTS public_votes_submission_id_idx ON public.public_votes (submission_id);
CREATE INDEX IF NOT EXISTS public_votes_voter_uid_idx ON public.public_votes (voter_uid);

ALTER TABLE public.public_votes ENABLE ROW LEVEL SECURITY;

-- 2. Policies
DROP POLICY IF EXISTS "public_votes_select_all" ON public.public_votes;
DROP POLICY IF EXISTS "public_votes_insert_authed" ON public.public_votes;
DROP POLICY IF EXISTS "public_votes_delete_own" ON public.public_votes;

-- Anyone (even anon) can read counts
CREATE POLICY "public_votes_select_all" ON public.public_votes
  FOR SELECT USING (true);

-- Only logged-in users can vote, only as themselves, and only before deadline
CREATE POLICY "public_votes_insert_authed" ON public.public_votes
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND voter_uid = auth.uid()
    AND now() < timestamptz '2026-10-19 23:59:00+00'
  );

-- A user can remove their own vote (before deadline)
CREATE POLICY "public_votes_delete_own" ON public.public_votes
  FOR DELETE USING (
    voter_uid = auth.uid()
    AND now() < timestamptz '2026-10-19 23:59:00+00'
  );

-- 3. Expose jury_vote_count on submissions (public-readable aggregate, no voter info).
--    The votes table itself stays jury-only; this column is the aggregate.
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS jury_vote_count integer NOT NULL DEFAULT 0;

-- Backfill from current votes
UPDATE public.submissions s
SET jury_vote_count = COALESCE((SELECT COUNT(*) FROM public.votes v WHERE v.submission_id = s.id), 0);

-- Keep jury_vote_count in sync with votes table (trigger)
CREATE OR REPLACE FUNCTION public.sync_jury_vote_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.submissions SET jury_vote_count = jury_vote_count + 1 WHERE id = NEW.submission_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.submissions SET jury_vote_count = GREATEST(jury_vote_count - 1, 0) WHERE id = OLD.submission_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS sync_jury_vote_count_trigger ON public.votes;
CREATE TRIGGER sync_jury_vote_count_trigger
  AFTER INSERT OR DELETE ON public.votes
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_jury_vote_count();

-- 4. Verify
SELECT 'public_votes + jury_vote_count ready' AS status,
       (SELECT COUNT(*) FROM public.submissions WHERE jury_vote_count > 0) AS shortlisted_projects,
       (SELECT COUNT(*) FROM public.public_votes) AS public_votes_cast;
