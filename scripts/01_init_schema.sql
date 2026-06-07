-- EduPlan AI Database Schema
-- This script creates all necessary tables for the lesson planning platform

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  school_name TEXT,
  grade_level TEXT[] DEFAULT '{}',
  subjects TEXT[] DEFAULT '{}',
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_school ON public.users(school_name);

-- Lessons table
CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  grade_level TEXT,
  duration_minutes INTEGER,
  learning_objectives TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_published BOOLEAN DEFAULT FALSE,
  is_template BOOLEAN DEFAULT FALSE
);

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own lessons" ON public.lessons FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own lessons" ON public.lessons FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own lessons" ON public.lessons FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own lessons" ON public.lessons FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_lessons_user ON public.lessons(user_id);
CREATE INDEX IF NOT EXISTS idx_lessons_subject ON public.lessons(subject);
CREATE INDEX IF NOT EXISTS idx_lessons_grade ON public.lessons(grade_level);
CREATE INDEX IF NOT EXISTS idx_lessons_published ON public.lessons(is_published);

-- Lesson blocks table
CREATE TABLE IF NOT EXISTS public.lesson_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'intro', 'activity', 'discussion', 'assessment', 'closing'
  title TEXT NOT NULL,
  content TEXT,
  order_index INTEGER NOT NULL,
  duration_minutes INTEGER,
  materials TEXT[],
  instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.lesson_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage blocks of their lessons" ON public.lesson_blocks 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.lessons 
      WHERE lessons.id = lesson_blocks.lesson_id 
      AND lessons.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_blocks_lesson ON public.lesson_blocks(lesson_id);
CREATE INDEX IF NOT EXISTS idx_blocks_type ON public.lesson_blocks(type);
CREATE INDEX IF NOT EXISTS idx_blocks_order ON public.lesson_blocks(lesson_id, order_index);

-- Resources table
CREATE TABLE IF NOT EXISTS public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  file_type TEXT,
  file_size INTEGER,
  resource_type TEXT, -- 'document', 'image', 'video', 'link'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own resources" ON public.resources FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_resources_user ON public.resources(user_id);
CREATE INDEX IF NOT EXISTS idx_resources_lesson ON public.resources(lesson_id);

-- Templates table
CREATE TABLE IF NOT EXISTS public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  subject TEXT,
  grade_level TEXT,
  block_structure JSONB,
  is_public BOOLEAN DEFAULT FALSE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own templates" ON public.templates FOR SELECT 
  USING (auth.uid() = user_id OR is_public = TRUE);
CREATE POLICY "Users can manage their own templates" ON public.templates 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own templates" ON public.templates FOR UPDATE 
  USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own templates" ON public.templates FOR DELETE 
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_templates_user ON public.templates(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_public ON public.templates(is_public);
CREATE INDEX IF NOT EXISTS idx_templates_subject ON public.templates(subject);

-- Curriculum standards table
CREATE TABLE IF NOT EXISTS public.curriculum_standards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  grade_level TEXT,
  standard_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_standards_subject ON public.curriculum_standards(subject);
CREATE INDEX IF NOT EXISTS idx_standards_grade ON public.curriculum_standards(grade_level);
CREATE INDEX IF NOT EXISTS idx_standards_code ON public.curriculum_standards(code);

-- Gap analysis table
CREATE TABLE IF NOT EXISTS public.gap_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  missing_standards TEXT[] DEFAULT '{}',
  content_gaps TEXT[] DEFAULT '{}',
  suggested_additions TEXT[] DEFAULT '{}',
  analysis_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.gap_analysis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view gap analysis of their lessons" ON public.gap_analysis 
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons 
      WHERE lessons.id = gap_analysis.lesson_id 
      AND lessons.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_gap_analysis_lesson ON public.gap_analysis(lesson_id);

-- Time estimates table
CREATE TABLE IF NOT EXISTS public.time_estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  block_id UUID REFERENCES public.lesson_blocks(id) ON DELETE CASCADE,
  estimated_minutes INTEGER,
  confidence_score FLOAT,
  reasoning TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.time_estimates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view time estimates of their lessons" ON public.time_estimates 
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons 
      WHERE lessons.id = time_estimates.lesson_id 
      AND lessons.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_time_estimates_lesson ON public.time_estimates(lesson_id);

-- Reusability scores table
CREATE TABLE IF NOT EXISTS public.reusability_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  clarity_score FLOAT,
  structure_score FLOAT,
  completeness_score FLOAT,
  overall_score FLOAT,
  improvement_suggestions TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.reusability_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view reusability scores of their lessons" ON public.reusability_scores 
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons 
      WHERE lessons.id = reusability_scores.lesson_id 
      AND lessons.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_reusability_lesson ON public.reusability_scores(lesson_id);

-- Lesson analytics table
CREATE TABLE IF NOT EXISTS public.lesson_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  views_count INTEGER DEFAULT 0,
  uses_count INTEGER DEFAULT 0,
  downloads_count INTEGER DEFAULT 0,
  average_rating FLOAT,
  total_ratings INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.lesson_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view analytics of their lessons" ON public.lesson_analytics 
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons 
      WHERE lessons.id = lesson_analytics.lesson_id 
      AND lessons.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_analytics_lesson ON public.lesson_analytics(lesson_id);

-- Peer sharing table
CREATE TABLE IF NOT EXISTS public.peer_sharing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  shared_by_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.peer_sharing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view shared lessons" ON public.peer_sharing FOR SELECT USING (TRUE);
CREATE POLICY "Users can share their own lessons" ON public.peer_sharing 
  FOR INSERT WITH CHECK (auth.uid() = shared_by_user_id);

CREATE INDEX IF NOT EXISTS idx_peer_sharing_lesson ON public.peer_sharing(lesson_id);
CREATE INDEX IF NOT EXISTS idx_peer_sharing_user ON public.peer_sharing(shared_by_user_id);
CREATE INDEX IF NOT EXISTS idx_peer_sharing_category ON public.peer_sharing(category);

-- Student engagement table
CREATE TABLE IF NOT EXISTS public.student_engagement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL, -- Can be anonymous or linked to user
  engagement_score FLOAT,
  participation_level TEXT, -- 'low', 'medium', 'high'
  questions_asked INTEGER DEFAULT 0,
  contributions INTEGER DEFAULT 0,
  activity_log JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.student_engagement ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can view engagement for their lessons" ON public.student_engagement 
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons 
      WHERE lessons.id = student_engagement.lesson_id 
      AND lessons.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_engagement_lesson ON public.student_engagement(lesson_id);
CREATE INDEX IF NOT EXISTS idx_engagement_student ON public.student_engagement(student_id);

-- Lesson versions table
CREATE TABLE IF NOT EXISTS public.lesson_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by_user_id UUID NOT NULL REFERENCES public.users(id)
);

ALTER TABLE public.lesson_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view versions of their lessons" ON public.lesson_versions 
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons 
      WHERE lessons.id = lesson_versions.lesson_id 
      AND lessons.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_versions_lesson ON public.lesson_versions(lesson_id);
CREATE INDEX IF NOT EXISTS idx_versions_number ON public.lesson_versions(lesson_id, version_number);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON public.lessons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blocks_updated_at BEFORE UPDATE ON public.lesson_blocks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON public.resources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON public.templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gap_analysis_updated_at BEFORE UPDATE ON public.gap_analysis
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_time_estimates_updated_at BEFORE UPDATE ON public.time_estimates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reusability_scores_updated_at BEFORE UPDATE ON public.reusability_scores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_analytics_updated_at BEFORE UPDATE ON public.lesson_analytics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_peer_sharing_updated_at BEFORE UPDATE ON public.peer_sharing
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_engagement_updated_at BEFORE UPDATE ON public.student_engagement
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
