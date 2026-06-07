-- EduPlan AI Database Schema
-- Run this in your Supabase SQL editor.
-- RLS policies use DROP + CREATE so this file is re-runnable on Postgres 14+.

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  school_name TEXT,
  grade_levels TEXT[] DEFAULT '{}',
  subjects TEXT[] DEFAULT '{}',
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Lessons table - core lesson structure
CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  duration_minutes INTEGER,
  estimated_duration_minutes INTEGER,
  learning_objectives TEXT[] DEFAULT '{}',
  difficulty_level TEXT DEFAULT 'medium',
  is_template BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT FALSE,
  visibility TEXT DEFAULT 'private',
  version_number INTEGER DEFAULT 1,
  parent_lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Lesson blocks - the drag-and-drop building blocks
CREATE TABLE IF NOT EXISTS public.lesson_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  block_type TEXT NOT NULL, -- 'text', 'heading', 'image', 'video', 'quiz', 'discussion', 'activity'
  title TEXT,
  content TEXT,
  position INTEGER NOT NULL,
  duration_minutes INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Quiz questions - for question generator
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_block_id UUID NOT NULL REFERENCES public.lesson_blocks(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL, -- 'multiple_choice', 'short_answer', 'true_false', 'essay'
  difficulty TEXT DEFAULT 'medium',
  options JSONB, -- for multiple choice: [{id, text, is_correct}, ...]
  correct_answer TEXT,
  explanation TEXT,
  bloom_level TEXT, -- 'remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Resources - for resource management
CREATE TABLE IF NOT EXISTS public.resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL, -- 'document', 'video', 'image', 'link', 'file'
  title TEXT NOT NULL,
  description TEXT,
  url TEXT,
  file_path TEXT, -- for Supabase storage
  file_size INTEGER,
  mime_type TEXT,
  is_external BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Curriculum standards - for curriculum alignment
CREATE TABLE IF NOT EXISTS public.curriculum_standards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  standard_code TEXT NOT NULL UNIQUE,
  standard_title TEXT NOT NULL,
  standard_description TEXT,
  subject TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  grade_band TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Lesson standards mapping
CREATE TABLE IF NOT EXISTS public.lesson_standards (
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  standard_id UUID NOT NULL REFERENCES public.curriculum_standards(id) ON DELETE CASCADE,
  PRIMARY KEY (lesson_id, standard_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Templates - reusable lesson templates
CREATE TABLE IF NOT EXISTS public.lesson_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  category TEXT,
  template_data JSONB NOT NULL,
  thumbnail_url TEXT,
  usage_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2),
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Peer sharing - for the peer marketplace
CREATE TABLE IF NOT EXISTS public.peer_lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  price DECIMAL(10,2) DEFAULT 0,
  is_approved BOOLEAN DEFAULT FALSE,
  download_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2),
  rating_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Lesson assignments (teacher assigns a lesson to a student by email)
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

-- Student engagement tracking
CREATE TABLE IF NOT EXISTS public.student_engagement (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'not_started', -- 'not_started', 'in_progress', 'completed'
  completion_percentage INTEGER DEFAULT 0,
  time_spent_minutes INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  quiz_score DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Lesson analytics
CREATE TABLE IF NOT EXISTS public.lesson_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  total_students INTEGER DEFAULT 0,
  completed_students INTEGER DEFAULT 0,
  avg_time_minutes DECIMAL(10,2),
  avg_quiz_score DECIMAL(5,2),
  difficulty_feedback_avg DECIMAL(3,2),
  engagement_score DECIMAL(5,2),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Lesson versions for history tracking
CREATE TABLE IF NOT EXISTS public.lesson_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  snapshot JSONB NOT NULL,
  change_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID NOT NULL REFERENCES public.users(id)
);

-- AI generation logs
CREATE TABLE IF NOT EXISTS public.ai_generation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  generation_type TEXT NOT NULL, -- 'lesson', 'questions', 'gap_analysis'
  prompt TEXT,
  tokens_used INTEGER,
  cost DECIMAL(10,4),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lessons_user_id ON public.lessons(user_id);
CREATE INDEX IF NOT EXISTS idx_lessons_subject ON public.lessons(subject);
CREATE INDEX IF NOT EXISTS idx_lessons_grade_level ON public.lessons(grade_level);
CREATE INDEX IF NOT EXISTS idx_lessons_is_published ON public.lessons(is_published);
CREATE INDEX IF NOT EXISTS idx_lesson_blocks_lesson_id ON public.lesson_blocks(lesson_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_lesson_block_id ON public.quiz_questions(lesson_block_id);
CREATE INDEX IF NOT EXISTS idx_resources_lesson_id ON public.resources(lesson_id);
CREATE INDEX IF NOT EXISTS idx_peer_lessons_creator_id ON public.peer_lessons(creator_id);
CREATE INDEX IF NOT EXISTS idx_lesson_assignments_lesson_id ON public.lesson_assignments(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_assignments_student_email ON public.lesson_assignments(student_email);
CREATE INDEX IF NOT EXISTS idx_student_engagement_lesson_id ON public.student_engagement(lesson_id);
CREATE INDEX IF NOT EXISTS idx_student_engagement_student_id ON public.student_engagement(student_id);
CREATE INDEX IF NOT EXISTS idx_ai_generation_logs_user_id ON public.ai_generation_logs(user_id);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peer_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_engagement ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generation_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can create their own profile" ON public.users;
CREATE POLICY "Users can create their own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for lessons
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

DROP POLICY IF EXISTS "Users can create lessons" ON public.lessons;
CREATE POLICY "Users can create lessons" ON public.lessons
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own lessons" ON public.lessons;
CREATE POLICY "Users can update their own lessons" ON public.lessons
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own lessons" ON public.lessons;
CREATE POLICY "Users can delete their own lessons" ON public.lessons
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for lesson_blocks
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

DROP POLICY IF EXISTS "Users can manage blocks of their lessons" ON public.lesson_blocks;
CREATE POLICY "Users can manage blocks of their lessons" ON public.lesson_blocks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lessons
      WHERE lessons.id = lesson_blocks.lesson_id
      AND lessons.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update blocks of their lessons" ON public.lesson_blocks;
CREATE POLICY "Users can update blocks of their lessons" ON public.lesson_blocks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.lessons
      WHERE lessons.id = lesson_blocks.lesson_id
      AND lessons.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete blocks of their lessons" ON public.lesson_blocks;
CREATE POLICY "Users can delete blocks of their lessons" ON public.lesson_blocks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.lessons
      WHERE lessons.id = lesson_blocks.lesson_id
      AND lessons.user_id = auth.uid()
    )
  );

-- RLS Policies for resources
DROP POLICY IF EXISTS "Users can view resources of their lessons" ON public.resources;
CREATE POLICY "Users can view resources of their lessons" ON public.resources
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.lessons
      WHERE lessons.id = resources.lesson_id
      AND (lessons.user_id = auth.uid() OR lessons.is_published = TRUE)
    )
  );

DROP POLICY IF EXISTS "Users can manage resources in their lessons" ON public.resources;
CREATE POLICY "Users can manage resources in their lessons" ON public.resources
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.lessons
      WHERE lessons.id = resources.lesson_id
      AND lessons.user_id = auth.uid()
    )
  );

-- RLS Policies for student_engagement
DROP POLICY IF EXISTS "Teachers can view student engagement for their lessons" ON public.student_engagement;
CREATE POLICY "Teachers can view student engagement for their lessons" ON public.student_engagement
  FOR SELECT USING (
    teacher_id = auth.uid() OR student_id = auth.uid()
  );

-- RLS Policies for curriculum_standards (public read)
DROP POLICY IF EXISTS "Curriculum standards are public" ON public.curriculum_standards;
CREATE POLICY "Curriculum standards are public" ON public.curriculum_standards
  FOR SELECT USING (true);

-- RLS Policies for lesson_standards
DROP POLICY IF EXISTS "Users can view lesson standards for accessible lessons" ON public.lesson_standards;
CREATE POLICY "Users can view lesson standards for accessible lessons" ON public.lesson_standards
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.lessons
      WHERE lessons.id = lesson_standards.lesson_id
      AND (lessons.user_id = auth.uid() OR lessons.is_published = TRUE)
    )
  );

DROP POLICY IF EXISTS "Users can insert lesson standards for own lessons" ON public.lesson_standards;
CREATE POLICY "Users can insert lesson standards for own lessons" ON public.lesson_standards
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lessons
      WHERE lessons.id = lesson_standards.lesson_id
      AND lessons.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete lesson standards for own lessons" ON public.lesson_standards;
CREATE POLICY "Users can delete lesson standards for own lessons" ON public.lesson_standards
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.lessons
      WHERE lessons.id = lesson_standards.lesson_id
      AND lessons.user_id = auth.uid()
    )
  );

-- RLS Policies for peer_lessons (public read, owner write)
DROP POLICY IF EXISTS "Published peer lessons are public" ON public.peer_lessons;
CREATE POLICY "Published peer lessons are public" ON public.peer_lessons
  FOR SELECT USING (is_approved = TRUE OR creator_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage their peer lessons" ON public.peer_lessons;
CREATE POLICY "Users can manage their peer lessons" ON public.peer_lessons
  FOR INSERT WITH CHECK (creator_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their peer lessons" ON public.peer_lessons;
CREATE POLICY "Users can update their peer lessons" ON public.peer_lessons
  FOR UPDATE USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

-- RLS Policies for lesson_assignments
DROP POLICY IF EXISTS "Teachers can manage their assignments" ON public.lesson_assignments;
CREATE POLICY "Teachers can manage their assignments" ON public.lesson_assignments
  FOR ALL USING (teacher_id = auth.uid());

DROP POLICY IF EXISTS "Students can view their assignments" ON public.lesson_assignments;
CREATE POLICY "Students can view their assignments" ON public.lesson_assignments
  FOR SELECT USING (
    student_id = auth.uid()
    OR student_email = (SELECT email FROM public.users WHERE id = auth.uid())
  );

-- Create trigger function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at (drops allow re-running this script)
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lessons_updated_at ON public.lessons;
CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON public.lessons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lesson_blocks_updated_at ON public.lesson_blocks;
CREATE TRIGGER update_lesson_blocks_updated_at BEFORE UPDATE ON public.lesson_blocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lesson_templates_updated_at ON public.lesson_templates;
CREATE TRIGGER update_lesson_templates_updated_at BEFORE UPDATE ON public.lesson_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_peer_lessons_updated_at ON public.peer_lessons;
CREATE TRIGGER update_peer_lessons_updated_at BEFORE UPDATE ON public.peer_lessons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_student_engagement_updated_at ON public.student_engagement;
CREATE TRIGGER update_student_engagement_updated_at BEFORE UPDATE ON public.student_engagement
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample curriculum standards (US Common Core Standards)
INSERT INTO public.curriculum_standards (standard_code, standard_title, standard_description, subject, grade_level, grade_band)
VALUES
  ('CCSS.ELA-LITERACY.RI.4.1', 'Refer to Details and Examples', 'Refer to details and examples in a text when explaining what the text says explicitly', 'English Language Arts', '4', 'Elementary'),
  ('CCSS.MATH.4.NBT.A.1', 'Recognize Place Value', 'Recognize that in a multi-digit whole number, a digit in one place represents ten times', 'Mathematics', '4', 'Elementary'),
  ('NGSS.4-LS1-1', 'Life Processes', 'Construct an argument that plants get the materials they need for growth', 'Science', '4', 'Elementary'),
  ('CCSS.ELA-LITERACY.RI.8.1', 'Cite Evidence', 'Cite textual evidence that most strongly supports an analysis of what the text says', 'English Language Arts', '8', 'Middle School'),
  ('CCSS.MATH.8.EE.A.1', 'Laws of Exponents', 'Know and apply the properties of integer exponents', 'Mathematics', '8', 'Middle School'),
  ('NGSS.MS-ETS1-1', 'Engineering Design', 'Define the criteria and constraints of a design challenge', 'Engineering & Technology', '8', 'Middle School'),
  ('CCSS.ELA-LITERACY.RI.9-10.1', 'Cite Evidence', 'Cite strong and thorough textual evidence to support analysis', 'English Language Arts', '9-10', 'High School'),
  ('CCSS.MATH.HSA-APR.A.1', 'Polynomials', 'Understand that polynomials form a system', 'Mathematics', '9-10', 'High School'),
  ('NGSS.HS-PS3-3', 'Energy', 'Design, build, and refine a device that works within given constraints', 'Physics & Engineering', '9-10', 'High School')
ON CONFLICT (standard_code) DO NOTHING;
