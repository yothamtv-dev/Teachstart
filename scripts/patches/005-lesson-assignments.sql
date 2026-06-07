-- Fixes PostgREST: Could not find the table 'public.lesson_assignments' in the schema cache
-- (table missing). Safe to re-run.
--
-- Same definitions as scripts/patches/002-roles-assignments-quizzes.sql (assignments section only).

CREATE TABLE IF NOT EXISTS public.lesson_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  student_email TEXT NOT NULL,
  student_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  due_date TIMESTAMP WITH TIME ZONE,
  note TEXT,
  UNIQUE (lesson_id, student_email)
);

ALTER TABLE public.lesson_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teachers can manage their assignments" ON public.lesson_assignments;
DROP POLICY IF EXISTS "Students can view their assignments" ON public.lesson_assignments;

CREATE POLICY "Teachers can manage their assignments" ON public.lesson_assignments
  FOR ALL USING (teacher_id = auth.uid());

CREATE POLICY "Students can view their assignments" ON public.lesson_assignments
  FOR SELECT USING (
    student_id = auth.uid()
    OR student_email = (SELECT email FROM public.users WHERE id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_lesson_assignments_student_email ON public.lesson_assignments(student_email);
CREATE INDEX IF NOT EXISTS idx_lesson_assignments_lesson_id ON public.lesson_assignments(lesson_id);
