-- Fix: create storage bucket for submissions (the previous SQL didn't create it)

-- First check what exists
SELECT * FROM storage.buckets WHERE id = 'submissions';

-- Create the bucket (or update if exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'submissions',
  'submissions',
  true,
  52428800,  -- 50MB per file
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Re-create storage policies (in case they got dropped)
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

-- Verify
SELECT id, name, public, file_size_limit FROM storage.buckets WHERE id = 'submissions';
