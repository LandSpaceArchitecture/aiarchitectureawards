-- Remove WATER ALBUM (Yongheng Toto Hu) per author request
-- Project ID: 0f681f7b-b0a3-4b05-8005-d3ea7ee6f671

-- 1) Confirm the row first (dry run)
SELECT id, project_title, author_name, email, submission_status
FROM public.submissions
WHERE id = '0f681f7b-b0a3-4b05-8005-d3ea7ee6f671';

-- 2) Delete the submission
DELETE FROM public.submissions
WHERE id = '0f681f7b-b0a3-4b05-8005-d3ea7ee6f671';

-- 3) Verify deletion
SELECT count(*) AS still_present
FROM public.submissions
WHERE id = '0f681f7b-b0a3-4b05-8005-d3ea7ee6f671';
