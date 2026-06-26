-- Add entrant_type column to submissions table
-- (Student vs Professional pricing tier)

ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS entrant_type text NOT NULL DEFAULT 'professional'
  CHECK (entrant_type IN ('student', 'professional'));

-- Optional: also track fee_paid for accurate historical records
ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS fee_paid integer;

-- Verify
SELECT
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'submissions'
  AND column_name IN ('entrant_type', 'fee_paid');
