-- Add ai_tools column to submissions table
-- Text field where entrants list the AI tools they used (Midjourney, ChatGPT, etc.)

ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS ai_tools text NOT NULL DEFAULT '';

-- Verify
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'submissions'
  AND column_name = 'ai_tools';
