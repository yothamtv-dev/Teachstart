-- Students assigned via lesson_assignments must read lessons + blocks even when is_published = false.
-- Requires public.lesson_assignments (patches/002 or 005).
--
-- Run in Supabase SQL editor after lesson_assignments exists.

DROP POLICY IF EXISTS "Users can view their own lessons" ON public.lessons;
CREATE POLICY "Users can view their own lessons" ON public.lessons
  FOR SELECT USING (
    auth.uid() = user_id
    OR is_published = TRUE
    OR EXISTS (
      SELECT 1
      FROM public.lesson_assignments la
      WHERE la.lesson_id = lessons.id
      AND (
        la.student_id = auth.uid()
        OR la.student_email = (SELECT u.email FROM public.users u WHERE u.id = auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "Users can view blocks of their lessons" ON public.lesson_blocks;
CREATE POLICY "Users can view blocks of their lessons" ON public.lesson_blocks
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.lessons l
      WHERE l.id = lesson_blocks.lesson_id
      AND (
        l.user_id = auth.uid()
        OR l.is_published = TRUE
        OR EXISTS (
          SELECT 1
          FROM public.lesson_assignments la
          WHERE la.lesson_id = l.id
          AND (
            la.student_id = auth.uid()
            OR la.student_email = (SELECT u.email FROM public.users u WHERE u.id = auth.uid())
          )
        )
      )
    )
  );
