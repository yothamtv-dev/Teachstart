'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  BookOpen,
  Trophy,
  Clock,
  CheckCircle2,
  ArrowRight,
  Star,
  PlayCircle,
} from 'lucide-react'

type Assignment = {
  id: string
  lesson_id: string
  due_date: string | null
  note: string | null
  lesson: {
    id: string
    title: string
    subject: string
    grade_level: string
    duration_minutes: number | null
    difficulty_level: string
  }
}

type QuizAttempt = {
  id: string
  lesson_id: string
  score: number
  total: number
  score_pct: number
  created_at: string
  lesson: { title: string }
}

export default function StudentDashboard() {
  const { profile, user } = useAuth()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [attempts, setAttempts] = useState<QuizAttempt[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    ;(async () => {
      try {
        const email = profile?.email || user.email || ''
        const [assignRes, attemptRes] = await Promise.all([
          supabase
            .from('lesson_assignments')
            .select('id, lesson_id, due_date, note, lesson:lessons(id, title, subject, grade_level, duration_minutes, difficulty_level)')
            .or(`student_id.eq.${user.id},student_email.eq.${email}`)
            .order('assigned_at', { ascending: false }),
          supabase
            .from('quiz_attempts')
            .select('id, lesson_id, score, total, score_pct, created_at, lesson:lessons(title)')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5),
        ])
        setAssignments((assignRes.data || []) as any[])
        setAttempts((attemptRes.data || []) as any[])
      } finally {
        setLoading(false)
      }
    })()
  }, [user, profile])

  const avgScore =
    attempts.length > 0
      ? Math.round(attempts.reduce((s, a) => s + (a.score_pct || 0), 0) / attempts.length)
      : null

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold mb-1">
          Welcome back, {profile?.full_name?.split(' ')[0] || 'Student'}!
        </h1>
        <p className="text-muted-foreground">Here&apos;s everything you need to catch up today.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card className="p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="text-2xl font-bold">{assignments.length}</div>
            <div className="text-xs text-muted-foreground">Assigned Lessons</div>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <div className="text-2xl font-bold">{attempts.length}</div>
            <div className="text-xs text-muted-foreground">Quizzes Taken</div>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/40 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <div className="text-2xl font-bold">{avgScore !== null ? `${avgScore}%` : '—'}</div>
            <div className="text-xs text-muted-foreground">Avg. Quiz Score</div>
          </div>
        </Card>
      </div>

      {/* Assigned Lessons */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Assigned Lessons</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/student/lessons">
              See all <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </Button>
        </div>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : assignments.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No lessons assigned yet. Ask your teacher for a lesson link.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {assignments.slice(0, 4).map((a) => (
              <Card key={a.id} className="p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{a.lesson?.title || 'Lesson'}</p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    <Badge variant="secondary" className="text-[11px]">
                      {a.lesson?.subject}
                    </Badge>
                    <Badge variant="outline" className="text-[11px] capitalize">
                      {a.lesson?.difficulty_level || 'mixed'}
                    </Badge>
                    {a.lesson?.duration_minutes && (
                      <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                        <Clock className="w-3 h-3" />
                        {a.lesson.duration_minutes} min
                      </span>
                    )}
                    {a.due_date && (
                      <span className="text-xs text-orange-500 font-medium">
                        Due {new Date(a.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {a.note && <p className="text-xs text-muted-foreground mt-1 italic">{a.note}</p>}
                </div>
                <Button size="sm" className="shrink-0 gap-1" asChild>
                  <Link href={`/student/learn/${a.lesson_id}`}>
                    <PlayCircle className="w-4 h-4" />
                    Start
                  </Link>
                </Button>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Recent quiz scores */}
      {attempts.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Quiz Results</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/student/scores">
                See all <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </Button>
          </div>
          <div className="space-y-3">
            {attempts.map((a) => (
              <Card key={a.id} className="p-4">
                <div className="flex items-center gap-3">
                  <Star className="w-5 h-5 text-yellow-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{(a.lesson as any)?.title || 'Lesson'}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(a.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-lg">{Math.round(a.score_pct)}%</p>
                    <p className="text-xs text-muted-foreground">{a.score}/{a.total} correct</p>
                  </div>
                </div>
                <Progress value={a.score_pct} className="h-1.5 mt-2" />
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
