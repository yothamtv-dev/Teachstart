'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BookOpen, Clock, PlayCircle } from 'lucide-react'

type Assignment = {
  id: string
  lesson_id: string
  due_date: string | null
  note: string | null
  lesson: {
    id: string
    title: string
    description: string | null
    subject: string
    grade_level: string
    duration_minutes: number | null
    difficulty_level: string
  }
}

export default function StudentLessonsPage() {
  const { profile, user } = useAuth()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    ;(async () => {
      const email = profile?.email || user.email || ''
      const { data } = await supabase
        .from('lesson_assignments')
        .select('id, lesson_id, due_date, note, lesson:lessons(id, title, description, subject, grade_level, duration_minutes, difficulty_level)')
        .or(`student_id.eq.${user.id},student_email.eq.${email}`)
        .order('assigned_at', { ascending: false })
      setAssignments((data || []) as any[])
      setLoading(false)
    })()
  }, [user, profile])

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">My Assigned Lessons</h1>
      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : assignments.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No lessons assigned yet. Your teacher will share lessons with you.</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {assignments.map((a) => (
            <Card key={a.id} className="p-5 flex flex-col gap-3">
              <div className="flex-1">
                <h3 className="font-semibold text-base line-clamp-2">{a.lesson?.title || 'Lesson'}</h3>
                {a.lesson?.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{a.lesson.description}</p>
                )}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <Badge variant="secondary" className="text-xs">{a.lesson?.subject}</Badge>
                  <Badge variant="outline" className="text-xs">{a.lesson?.grade_level}</Badge>
                  <Badge variant="outline" className="text-xs capitalize">{a.lesson?.difficulty_level || 'mixed'}</Badge>
                </div>
                {a.lesson?.duration_minutes && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                    <Clock className="w-3 h-3" /> {a.lesson.duration_minutes} min
                  </p>
                )}
                {a.due_date && (
                  <p className="text-xs text-orange-500 font-medium mt-1">
                    Due {new Date(a.due_date).toLocaleDateString()}
                  </p>
                )}
                {a.note && <p className="text-xs text-muted-foreground italic mt-1">{a.note}</p>}
              </div>
              <Button size="sm" className="w-full gap-1" asChild>
                <Link href={`/student/learn/${a.lesson_id}`}>
                  <PlayCircle className="w-4 h-4" />
                  Open Lesson
                </Link>
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
