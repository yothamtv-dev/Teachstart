-- Patch 002: Roles, Assignments, Quiz Attempts, Reviews
-- Run in Supabase SQL editor

-- 1. Add role to users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'teacher'
  CHECK (role IN ('teacher', 'student', 'admin'));

-- 2. Lesson assignments (teacher assigns lesson to student)
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

CREATE POLICY "Teachers can manage their assignments" ON public.lesson_assignments
  FOR ALL USING (teacher_id = auth.uid());

CREATE POLICY "Students can view their assignments" ON public.lesson_assignments
  FOR SELECT USING (
    student_id = auth.uid()
    OR student_email = (SELECT email FROM public.users WHERE id = auth.uid())
  );

-- 3. Quiz attempts
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  block_id TEXT,
  answers JSONB NOT NULL DEFAULT '{}',
  score INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  score_pct DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN total > 0 THEN (score::decimal / total) * 100 ELSE 0 END
  ) STORED,
  feedback JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own quiz attempts" ON public.quiz_attempts
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own quiz attempts" ON public.quiz_attempts
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Teachers can view quiz attempts for their lessons" ON public.quiz_attempts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.lessons
      WHERE lessons.id = quiz_attempts.lesson_id
      AND lessons.user_id = auth.uid()
    )
  );

-- 4. Lesson reviews / ratings
CREATE TABLE IF NOT EXISTS public.lesson_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (lesson_id, user_id)
);

ALTER TABLE public.lesson_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are public for published lessons" ON public.lesson_reviews
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.lessons
      WHERE lessons.id = lesson_reviews.lesson_id
      AND (lessons.is_published = TRUE OR lessons.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert own reviews" ON public.lesson_reviews
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own reviews" ON public.lesson_reviews
  FOR UPDATE USING (user_id = auth.uid());

-- 5. Index for performance
CREATE INDEX IF NOT EXISTS idx_lesson_assignments_student_email ON public.lesson_assignments(student_email);
CREATE INDEX IF NOT EXISTS idx_lesson_assignments_lesson_id ON public.lesson_assignments(lesson_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_lesson ON public.quiz_attempts(user_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_reviews_lesson_id ON public.lesson_reviews(lesson_id);
