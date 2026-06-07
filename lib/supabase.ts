import { createClient } from '@supabase/supabase-js'
import { getSupabaseAnonKey, getSupabaseUrl } from './supabase-config'

const noopSubscription = { unsubscribe: () => {} }

function createStubSupabase(): any {
  const notConfigured = { message: 'Supabase is not configured' }

  const stubQuery = () => {
    const q: any = {
      select: () => q,
      eq: () => q,
      single: async () => ({ data: null, error: notConfigured }),
      insert: async () => ({ error: notConfigured }),
    }
    return q
  }

  return {
    auth: {
      getSession: async () => ({ data: { session: null } }),
      getUser: async () => ({ data: { user: null } }),
      onAuthStateChange: (callback: (event: string, session: null) => void) => {
        queueMicrotask(() => callback('INITIAL_SESSION', null))
        return { data: { subscription: noopSubscription } }
      },
      signOut: async () => ({ error: null }),
      signInWithPassword: async () => ({
        data: { user: null, session: null },
        error: notConfigured,
      }),
      signUp: async () => ({
        data: { user: null, session: null },
        error: notConfigured,
      }),
    },
    from: stubQuery,
  }
}

let supabaseInstance: ReturnType<typeof createClient> | null = null

export const supabase = (() => {
  if (typeof window === 'undefined') {
    return createStubSupabase()
  }

  if (!supabaseInstance) {
    const supabaseUrl = getSupabaseUrl()
    const supabaseAnonKey = getSupabaseAnonKey()

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error(
        'Missing Supabase environment variables: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).',
      )
      return createStubSupabase()
    }

    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  }

  return supabaseInstance
})()

export type User = {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  school_name: string | null
  grade_levels: string[]
  subjects: string[]
  is_verified: boolean
  role: 'teacher' | 'student' | 'admin'
  subscription_tier?: 'free' | 'pro'
  subscription_status?: string | null
  stripe_customer_id?: string | null
  stripe_subscription_id?: string | null
  created_at: string
  updated_at: string
}

export type Lesson = {
  id: string
  user_id: string
  title: string
  description: string | null
  subject: string
  grade_level: string
  duration_minutes: number | null
  estimated_duration_minutes: number | null
  learning_objectives: string[]
  difficulty_level: string
  is_template: boolean
  is_published: boolean
  visibility: string
  version_number: number
  parent_lesson_id: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type LessonBlock = {
  id: string
  lesson_id: string
  block_type: string
  title: string | null
  content: string | null
  position: number
  duration_minutes: number | null
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export type QuizQuestion = {
  id: string
  lesson_block_id: string
  question_text: string
  question_type: string
  difficulty: string
  options: any
  correct_answer: string | null
  explanation: string | null
  bloom_level: string | null
  created_at: string
}

export type StudentEngagement = {
  id: string
  lesson_id: string
  student_id: string
  teacher_id: string
  status: string
  completion_percentage: number
  time_spent_minutes: number
  started_at: string | null
  completed_at: string | null
  quiz_score: number | null
  created_at: string
  updated_at: string
}

export type LessonAnalytics = {
  id: string
  lesson_id: string
  total_students: number
  completed_students: number
  avg_time_minutes: number | null
  avg_quiz_score: number | null
  difficulty_feedback_avg: number | null
  engagement_score: number | null
  last_updated: string
}
