-- Newsletter / 2027 announcement subscribers.
-- Anonymous visitors can insert their email; nobody can read the list
-- except admins (uses existing is_admin() helper).

CREATE TABLE IF NOT EXISTS public.subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS subscribers_created_at_idx
  ON public.subscribers (created_at DESC);

ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subscribers_insert_public" ON public.subscribers;
DROP POLICY IF EXISTS "subscribers_select_admin" ON public.subscribers;

-- Anyone (even anon) can submit an email
CREATE POLICY "subscribers_insert_public" ON public.subscribers
  FOR INSERT WITH CHECK (true);

-- Only admins can read the list
CREATE POLICY "subscribers_select_admin" ON public.subscribers
  FOR SELECT USING (public.is_admin());

-- Quick verification
SELECT 'subscribers table ready' AS status;
