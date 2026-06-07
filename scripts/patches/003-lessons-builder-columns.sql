-- If your project was created from an older init script, `lessons` may omit columns
-- the lesson builder writes. Run once in the Supabase SQL editor.

ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS estimated_duration_minutes INTEGER;

ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS difficulty_level TEXT DEFAULT 'medium';

-- lesson_blocks must match scripts/schema.sql (block_type, position, metadata JSONB).
-- If your table still uses legacy names (type, order_index), migrate separately.
