'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Edit2, Trash2, Clock, Users, BookMarked } from 'lucide-react'

export default function LessonDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const lessonId = params.id as string

  const [lesson, setLesson] = useState<any>(null)
  const [blocks, setBlocks] = useState<any[]>([])
  const [engagement, setEngagement] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchLesson = async () => {
      try {
        const { data: lessonRow, error } = await supabase
          .from('lessons')
          .select('*')
          .eq('id', lessonId)
          .single()

        if (error) throw error
        setLesson(lessonRow)

        const { data: lb } = await supabase
          .from('lesson_blocks')
          .select('*')
          .eq('lesson_id', lessonId)
          .order('position', { ascending: true })

        setBlocks(lb || [])

        const { data: engagementData } = await supabase
          .from('student_engagement')
          .select('*')
          .eq('lesson_id', lessonId)

        if (engagementData?.length) {
          const quizScores = engagementData
            .map((e: any) => (e.quiz_score != null ? Number(e.quiz_score) : null))
            .filter((n: number | null): n is number => n != null)
          const avgQuiz =
            quizScores.length > 0 ? quizScores.reduce((a, b) => a + b, 0) / quizScores.length : 0
          const avgCompletion =
            engagementData.reduce((acc: number, e: any) => acc + (e.completion_percentage || 0), 0) /
            engagementData.length
          setEngagement({
            total_students: new Set(engagementData.map((e: any) => e.student_id)).size,
            average_quiz: avgQuiz,
            average_completion: avgCompletion,
          })
        }
      } catch (error) {
        console.error('Error fetching lesson:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLesson()
  }, [user, lessonId])

  const handleDelete = async () => {
    if (!confirm('Delete this lesson permanently?')) return
    try {
      await supabase.from('lessons').delete().eq('id', lessonId)
      router.push('/dashboard/lessons')
    } catch (e) {
      console.error(e)
    }
  }

  if (loading) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        <p>Loading…</p>
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="p-12 text-center">
        <p className="text-muted-foreground">Lesson not found</p>
        <Button className="mt-4" variant="outline" onClick={() => router.push('/dashboard/lessons')}>
          Back to lessons
        </Button>
      </div>
    )
  }

  const totalDuration =
    blocks.reduce((sum, b) => sum + (b.duration_minutes || 0), 0) ||
    lesson.duration_minutes ||
    0

  const chartData = blocks.map((block: any) => ({
    name: (block.title || block.block_type || 'Block').slice(0, 18),
    duration: block.duration_minutes || 0,
  }))

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="border-b pb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap gap-2 mb-2">
            <Badge variant="secondary">{lesson.subject}</Badge>
            <Badge variant="outline">{lesson.grade_level}</Badge>
          </div>
          <h1 className="text-3xl font-bold">{lesson.title}</h1>
          {lesson.description && (
            <p className="text-muted-foreground mt-2">{lesson.description}</p>
          )}
          {lesson.learning_objectives?.length > 0 && (
            <ul className="mt-3 text-sm list-disc pl-5 text-muted-foreground">
              {lesson.learning_objectives.map((o: string, i: number) => (
                <li key={i}>{o}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => router.push(`/dashboard/builder?id=${lessonId}`)}>
            <Edit2 className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" onClick={() => router.push('/dashboard/curriculum')}>
            <BookMarked className="w-4 h-4 mr-2" />
            Curriculum
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Total duration</p>
          <p className="text-2xl font-bold mt-1 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            {totalDuration} min
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Blocks</p>
          <p className="text-2xl font-bold mt-1 flex items-center gap-2">
            <Users className="w-5 h-5 text-green-600" />
            {blocks.length}
          </p>
        </Card>
        {engagement && (
          <Card className="p-5">
            <p className="text-sm text-muted-foreground">Engagement</p>
            <p className="text-2xl font-bold mt-1">
              {Math.round(engagement.average_completion)}% avg completion
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Quiz avg: {engagement.average_quiz ? engagement.average_quiz.toFixed(1) : '—'} ·{' '}
              {engagement.total_students} students
            </p>
          </Card>
        )}
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Block timeline</h2>
        <div className="space-y-2">
          {blocks.map((block: any, index: number) => (
            <div key={block.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">
                  {index + 1}. {block.title || block.block_type}
                </p>
                <p className="text-sm text-muted-foreground capitalize">
                  {block.block_type} · {block.duration_minutes ?? '—'} min
                </p>
              </div>
            </div>
          ))}
          {blocks.length === 0 && (
            <p className="text-sm text-muted-foreground">No blocks — open the builder to add content.</p>
          )}
        </div>
      </Card>

      {chartData.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Duration by block</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="duration" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  )
}
