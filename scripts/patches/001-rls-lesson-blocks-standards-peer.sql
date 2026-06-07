-- Run once in Supabase SQL Editor if you already applied schema.sql without these policies.

-- lesson_blocks: allow replace-on-save (delete + insert) for lesson authors
CREATE POLICY "Users can update blocks of their lessons" ON public.lesson_blocks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.lessons
      WHERE lessons.id = lesson_blocks.lesson_id
      AND lessons.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete blocks of their lessons" ON public.lesson_blocks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.lessons
      WHERE lessons.id = lesson_blocks.lesson_id
      AND lessons.user_id = auth.uid()
    )
  );

-- lesson_standards: map lessons to curriculum_standards
CREATE POLICY "Users can view lesson standards for accessible lessons" ON public.lesson_standards
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.lessons
      WHERE lessons.id = lesson_standards.lesson_id
      AND (lessons.user_id = auth.uid() OR lessons.is_published = TRUE)
    )
  );

CREATE POLICY "Users can manage lesson standards for own lessons" ON public.lesson_standards
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.lessons
      WHERE lessons.id = lesson_standards.lesson_id
      AND lessons.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lessons
      WHERE lessons.id = lesson_standards.lesson_id
      AND lessons.user_id = auth.uid()
    )
  );

-- peer_lessons: creators can update their listings (e.g. stats)
CREATE POLICY "Users can update their peer lessons" ON public.peer_lessons
  FOR UPDATE USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());
