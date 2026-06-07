-- EduPlan AI Database Schema
-- PostgreSQL migration script for Supabase

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'teacher', -- teacher, admin, student
  school_name TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lessons table
CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT, -- Math, English, Science, History, etc.
  grade_level TEXT, -- K, 1-12, College
  duration_minutes INTEGER, -- Estimated duration
  objectives TEXT[], -- Array of learning objectives
  is_template BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lesson Blocks (components of a lesson)
CREATE TABLE IF NOT EXISTS public.blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  block_type TEXT NOT NULL, -- intro, content, activity, assessment, conclusion
  title TEXT,
  content TEXT,
  media_url TEXT, -- Image, video, audio URL
  position INTEGER, -- Order in lesson
  duration_minutes INTEGER,
  instructions TEXT,
  resources TEXT[], -- Array of resource IDs or URLs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Curriculum Standards
CREATE TABLE IF NOT EXISTS public.curriculum_standards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL, -- CCSS, state standards, IB, etc.
  code TEXT UNIQUE NOT NULL, -- e.g., "CCSS.MATH.3.OA.A.1"
  description TEXT,
  grade_level TEXT,
  subject TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lesson-Standard Junction Table
CREATE TABLE IF NOT EXISTS public.lesson_standards (
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  standard_id UUID NOT NULL REFERENCES public.curriculum_standards(id) ON DELETE CASCADE,
  PRIMARY KEY (lesson_id, standard_id)
);

-- Templates
CREATE TABLE IF NOT EXISTS public.templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  category TEXT, -- lesson_plan, unit, quiz, activity, etc.
  is_public BOOLEAN DEFAULT FALSE,
  reusability_score FLOAT DEFAULT 0, -- 0-100 based on usage and feedback
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Resources (files, links)
CREATE TABLE IF NOT EXISTS public.resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  resource_type TEXT NOT NULL, -- document, image, video, link, worksheet
  file_url TEXT NOT NULL,
  file_size INTEGER, -- in bytes
  mime_type TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Peer Sharing / Community
CREATE TABLE IF NOT EXISTS public.peer_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  shared_by_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  shared_with_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE, -- NULL if shared publicly
  share_type TEXT DEFAULT 'view', -- view, edit, copy
  shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Student Engagement Tracking
CREATE TABLE IF NOT EXISTS public.student_engagement (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  engagement_level FLOAT DEFAULT 0, -- 0-100 score
  completion_percentage FLOAT DEFAULT 0,
  time_spent_minutes INTEGER DEFAULT 0,
  last_accessed TIMESTAMP WITH TIME ZONE,
  quiz_score FLOAT,
  activity_completion BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics
CREATE TABLE IF NOT EXISTS public.analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL, -- views, uses, avg_completion, avg_engagement, feedback
  metric_value FLOAT,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lesson Versions (for tracking changes)
CREATE TABLE IF NOT EXISTS public.lesson_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  blocks JSONB, -- Snapshot of blocks at this version
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL
);

-- Row Level Security (RLS) Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peer_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_engagement ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_versions ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Lessons policies
CREATE POLICY "Users can view own lessons" ON public.lessons
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public lessons" ON public.lessons
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can create lessons" ON public.lessons
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lessons" ON public.lessons
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own lessons" ON public.lessons
  FOR DELETE USING (auth.uid() = user_id);

-- Blocks policies
CREATE POLICY "Users can view blocks of own lessons" ON public.blocks
  FOR SELECT USING (
    lesson_id IN (
      SELECT id FROM public.lessons WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage blocks in own lessons" ON public.blocks
  FOR INSERT WITH CHECK (
    lesson_id IN (
      SELECT id FROM public.lessons WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update blocks in own lessons" ON public.blocks
  FOR UPDATE USING (
    lesson_id IN (
      SELECT id FROM public.lessons WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete blocks in own lessons" ON public.blocks
  FOR DELETE USING (
    lesson_id IN (
      SELECT id FROM public.lessons WHERE user_id = auth.uid()
    )
  );

-- Templates policies
CREATE POLICY "Users can view own templates" ON public.templates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public templates" ON public.templates
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can create templates" ON public.templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates" ON public.templates
  FOR UPDATE USING (auth.uid() = user_id);

-- Resources policies
CREATE POLICY "Users can view resources in own lessons" ON public.resources
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create resources" ON public.resources
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own resources" ON public.resources
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own resources" ON public.resources
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_lessons_user_id ON public.lessons(user_id);
CREATE INDEX IF NOT EXISTS idx_lessons_created_at ON public.lessons(created_at);
CREATE INDEX IF NOT EXISTS idx_blocks_lesson_id ON public.blocks(lesson_id);
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON public.templates(user_id);
CREATE INDEX IF NOT EXISTS idx_resources_lesson_id ON public.resources(lesson_id);
CREATE INDEX IF NOT EXISTS idx_student_engagement_lesson_id ON public.student_engagement(lesson_id);
CREATE INDEX IF NOT EXISTS idx_analytics_lesson_id ON public.analytics(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_standards_lesson_id ON public.lesson_standards(lesson_id);
