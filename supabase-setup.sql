-- =========================================================================
-- AI Architecture Awards - Supabase Setup
-- Run this entire file in: Supabase Dashboard → SQL Editor → New Query
-- =========================================================================

-- 1. Drop existing tables (clean slate — only safe because this project has no real data yet!)
DROP TABLE IF EXISTS public.submissions CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 2. Profiles table (column names match the React app: uid, email, displayName, role)
CREATE TABLE public.profiles (
  uid uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  "displayName" text,
  role text NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Submissions table
CREATE TABLE public.submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uid uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  project_title text NOT NULL,
  category text[] NOT NULL DEFAULT '{}',
  short_description text,
  full_description text,
  author_name text,
  email text,
  country text,
  other_credits text,
  image_urls text[] NOT NULL DEFAULT '{}',
  video_url text,
  payment_status text NOT NULL DEFAULT 'pending',
  submission_status text NOT NULL DEFAULT 'submitted',
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- 4. SECURITY DEFINER helper to check admin (prevents recursion when used in policies)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE uid = auth.uid() AND role = 'admin'
  );
$$;

-- 5. Profile policies (NO recursion — never SELECT profiles inside profiles policies)
CREATE POLICY "profiles_select_all" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = uid);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = uid);

-- 6. Submission policies (uses helper function — safe, no recursion)
CREATE POLICY "submissions_select_all" ON public.submissions
  FOR SELECT USING (true);

CREATE POLICY "submissions_insert_authenticated" ON public.submissions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "submissions_update_own_or_admin" ON public.submissions
  FOR UPDATE USING (auth.uid() = uid OR public.is_admin());

CREATE POLICY "submissions_delete_own_or_admin" ON public.submissions
  FOR DELETE USING (auth.uid() = uid OR public.is_admin());

-- 7. Auto-create profile on new auth.users insert (so register flow doesn't need a separate INSERT)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (uid, email, "displayName", role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'user'
  )
  ON CONFLICT (uid) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. Storage bucket for submission images
INSERT INTO storage.buckets (id, name, public)
VALUES ('submissions', 'submissions', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "submissions_storage_read" ON storage.objects;
DROP POLICY IF EXISTS "submissions_storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "submissions_storage_update" ON storage.objects;
DROP POLICY IF EXISTS "submissions_storage_delete" ON storage.objects;

CREATE POLICY "submissions_storage_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'submissions');

CREATE POLICY "submissions_storage_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'submissions' AND auth.uid() IS NOT NULL
  );

CREATE POLICY "submissions_storage_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'submissions' AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "submissions_storage_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'submissions' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin())
  );

-- 9. Done. Verify with:
-- SELECT * FROM public.profiles;
-- SELECT * FROM public.submissions;
