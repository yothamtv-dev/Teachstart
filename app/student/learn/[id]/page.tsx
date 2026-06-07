'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { SmartVideoEmbed } from '@/components/learn/smart-video-embed'
import { LessonRichContent } from '@/components/learn/lesson-rich-content'
import { isPlayableVideoUrl } from '@/lib/video-embed'
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  ListOrdered,
  Sparkles,
  HelpCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type BlockRow = {
  id: string
  block_type: string
  title: string | null
  content: string | null
  position: number
  duration_minutes: number | null
  metadata: Record<string, unknown> | null
}

type Question = {
  question_text?: string
  question?: string
  options?: string[]
  correct_answer?: string
  explanation?: string
}

function progressKey(lessonId: string) {
  return `teachsmart-student-learn:${lessonId}`
}

export default function StudentLessonPlayerPage() {
  const params = useParams()
  const { user, loading: authLoading } = useAuth()
  const lessonId = params.id as string

  const [lesson, setLesson] = useState<any>(null)
  const [blocks, setBlocks] = useState<BlockRow[]>([])
  const [loading, setLoading] = useState(true)
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set())

  // Quiz state
  const [showQuiz, setShowQuiz] = useState(false)
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({})
  const [quizResult, setQuizResult] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)

  const allQuestions = useMemo(() => {
    const qs: Question[] = []
    blocks.forEach((b) => {
      const meta = (b.metadata || {}) as any
      if (Array.isArray(meta.generated_questions)) {
        qs.push(...meta.generated_questions)
      }
    })
    return qs
  }, [blocks])

  useEffect(() => {
    if (!lessonId) {
      setLoading(false)
      return
    }
    if (authLoading) return

    if (!user) {
      setLesson(null)
      setBlocks([])
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const { data: l, error: le } = await supabase.from('lessons').select('*').eq('id', lessonId).single()
        if (cancelled) return
        if (le || !l) {
          if (le) console.error('[student learn] lessons select:', le.message, le.code)
          setLesson(null)
        } else {
          setLesson(l)
        }

        const { data: b, error: be } = await supabase
          .from('lesson_blocks')
          .select('*')
          .eq('lesson_id', lessonId)
          .order('position', { ascending: true })
        if (cancelled) return
        if (be) console.error('[student learn] lesson_blocks select:', be.message, be.code)
        setBlocks(b || [])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [user, lessonId, authLoading])

  useEffect(() => {
    if (!lessonId || typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem(progressKey(lessonId))
      if (raw) setDoneIds(new Set(JSON.parse(raw).sections || []))
    } catch { /* ignore */ }
  }, [lessonId])

  const toggleSection = (blockId: string) => {
    const next = new Set(doneIds)
    if (next.has(blockId)) next.delete(blockId)
    else next.add(blockId)
    setDoneIds(next)
    try {
      localStorage.setItem(progressKey(lessonId), JSON.stringify({ sections: [...next], at: Date.now() }))
    } catch { /* ignore */ }
  }

  const submitQuiz = async () => {
    if (!user) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: user.id, lesson_id: lessonId, answers: quizAnswers }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Submission failed')
      setQuizResult(data)
      toast.success(`Quiz submitted! Score: ${data.score_pct}%`)
    } catch (e: any) {
      toast.error(e.message || 'Failed to submit quiz')
    } finally {
      setSubmitting(false)
    }
  }

  const progressPct = blocks.length ? Math.round((doneIds.size / blocks.length) * 100) : 0

  if (loading || authLoading) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
        Opening lesson…
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-12 text-center max-w-md mx-auto space-y-4">
        <p className="text-muted-foreground">Sign in with your school account to open this lesson.</p>
        <Button asChild variant="outline">
          <Link href={`/auth/login?next=/student/learn/${lessonId}`}>Sign in</Link>
        </Button>
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="p-12 text-center max-w-md mx-auto space-y-4">
        <p className="text-muted-foreground">
          This lesson isn&apos;t available. Ask your teacher to publish it or run the Supabase patch{' '}
          <code className="text-xs bg-muted px-1 rounded break-all">006-assigned-student-lesson-access.sql</code>{' '}
          so assigned students can open draft lessons.
        </p>
        <Button asChild variant="outline"><Link href="/student/lessons">Back to lessons</Link></Button>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-background">
      {/* Sticky header */}
      <div className="border-b bg-card/90 backdrop-blur-md sticky top-14 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Button variant="ghost" size="sm" className="gap-1 shrink-0" asChild>
              <Link href="/student/lessons"><ArrowLeft className="w-4 h-4" />My Lessons</Link>
            </Button>
            <span className="text-muted-foreground hidden sm:inline">|</span>
            <p className="text-sm font-medium truncate">{lesson.title}</p>
          </div>
          {allQuestions.length > 0 && !quizResult && (
            <Button size="sm" variant="outline" className="gap-1" onClick={() => setShowQuiz(true)}>
              <HelpCircle className="w-4 h-4" />
              Take Quiz
            </Button>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 grid lg:grid-cols-[1fr_300px] gap-8">
        {/* Main content */}
        <div className="space-y-8 min-w-0">
          <header className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{lesson.subject}</Badge>
              <Badge variant="outline">{lesson.grade_level}</Badge>
              <Badge variant="outline" className="capitalize">{lesson.difficulty_level || 'mixed'}</Badge>
              <span className="text-sm text-muted-foreground inline-flex items-center gap-1">
                <Clock className="w-4 h-4" /> {lesson.duration_minutes ?? 45} min
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{lesson.title}</h1>
            {lesson.description && (
              <p className="text-lg text-muted-foreground leading-relaxed">{lesson.description}</p>
            )}
            {lesson.learning_objectives?.length > 0 && (
              <Card className="p-4 bg-muted/40 border-dashed">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> What you&apos;ll learn
                </p>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  {lesson.learning_objectives.map((o: string, i: number) => <li key={i}>{o}</li>)}
                </ul>
              </Card>
            )}
          </header>

          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{progressPct}%</span>
            </div>
            <Progress value={progressPct} className="h-2" />
          </div>

          {/* Blocks */}
          <section className="space-y-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <ListOrdered className="w-5 h-5" /> Lesson sections
            </h2>
            {blocks.map((b, idx) => {
              const meta = (b.metadata || {}) as any
              const completed = doneIds.has(b.id)
              return (
                <article
                  key={b.id}
                  id={`block-${b.id}`}
                  className="rounded-xl border bg-card shadow-sm scroll-mt-32 overflow-hidden"
                >
                  <div className="flex items-start gap-3 p-4 border-b bg-muted/30">
                    <button
                      type="button"
                      onClick={() => toggleSection(b.id)}
                      className="mt-0.5 text-primary hover:opacity-80"
                    >
                      {completed
                        ? <CheckCircle2 className="w-6 h-6" />
                        : <Circle className="w-6 h-6 text-muted-foreground" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Section {idx + 1} · {b.block_type}
                      </p>
                      <h3 className="text-xl font-semibold">{b.title || 'Untitled section'}</h3>
                    </div>
                  </div>
                  <div className="p-4 md:p-6 space-y-4">
                    {meta.video_url && (
                      <SmartVideoEmbed url={meta.video_url} title={b.title || 'Video'} />
                    )}
                    {b.content?.trim() ? (
                      <LessonRichContent
                        content={b.content}
                        skipVideoUrls={meta.video_url ? [String(meta.video_url)] : []}
                      />
                    ) : !meta.video_url && (
                      <p className="text-sm italic text-muted-foreground">No content for this section.</p>
                    )}
                    {meta.attachments?.length > 0 && (
                      <div className="text-sm space-y-3">
                        <p className="font-medium">Resources</p>
                        <ul className="space-y-1">
                          {meta.attachments
                            .filter((a: any) => !isPlayableVideoUrl(a.url))
                            .map((a: any, i: number) => (
                              <li key={i}>
                                <a href={a.url} className="text-primary underline" target="_blank" rel="noreferrer">
                                  {a.title}
                                </a>
                              </li>
                            ))}
                        </ul>
                        {meta.attachments
                          .filter((a: any) => isPlayableVideoUrl(a.url))
                          .map((a: any, i: number) => (
                            <SmartVideoEmbed key={i} url={a.url} title={a.title} />
                          ))}
                      </div>
                    )}
                  </div>
                </article>
              )
            })}
          </section>

          {/* Quiz section */}
          {allQuestions.length > 0 && (
            <section>
              {!showQuiz && !quizResult && (
                <Button className="w-full gap-2" onClick={() => setShowQuiz(true)}>
                  <HelpCircle className="w-5 h-5" />
                  Take the lesson quiz ({allQuestions.length} questions)
                </Button>
              )}

              {showQuiz && !quizResult && (
                <Card className="p-6 space-y-6">
                  <h2 className="text-lg font-semibold">Lesson Quiz</h2>
                  <ol className="space-y-6">
                    {allQuestions.map((q, idx) => (
                      <li key={idx} className="space-y-3">
                        <p className="font-medium text-sm">
                          {idx + 1}. {q.question_text || q.question}
                        </p>
                        {q.options && (
                          <div className="space-y-2">
                            {q.options.map((opt, j) => (
                              <label
                                key={j}
                                className={cn(
                                  'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors text-sm',
                                  quizAnswers[String(idx)] === opt
                                    ? 'border-primary bg-primary/5 font-medium'
                                    : 'border-border hover:border-primary/50',
                                )}
                              >
                                <input
                                  type="radio"
                                  name={`q-${idx}`}
                                  value={opt}
                                  checked={quizAnswers[String(idx)] === opt}
                                  onChange={() =>
                                    setQuizAnswers((prev) => ({ ...prev, [String(idx)]: opt }))
                                  }
                                  className="accent-primary"
                                />
                                {opt}
                              </label>
                            ))}
                          </div>
                        )}
                        {!q.options && (
                          <input
                            type="text"
                            className="w-full border rounded-lg p-2 text-sm"
                            placeholder="Your answer…"
                            value={quizAnswers[String(idx)] || ''}
                            onChange={(e) =>
                              setQuizAnswers((prev) => ({ ...prev, [String(idx)]: e.target.value }))
                            }
                          />
                        )}
                      </li>
                    ))}
                  </ol>
                  <Button
                    className="w-full"
                    disabled={submitting || Object.keys(quizAnswers).length < allQuestions.length}
                    onClick={submitQuiz}
                  >
                    {submitting ? 'Grading…' : 'Submit Answers'}
                  </Button>
                </Card>
              )}

              {quizResult && (
                <Card className="p-6 space-y-5">
                  <div className="text-center">
                    <div className="text-5xl font-bold mb-2">
                      {Math.round(quizResult.score_pct)}%
                    </div>
                    <p className="text-muted-foreground">
                      You got {quizResult.score} out of {quizResult.total} questions correct
                    </p>
                    <Progress value={quizResult.score_pct} className="h-3 mt-3 rounded-full" />
                  </div>
                  <div className="space-y-4">
                    {allQuestions.map((q, idx) => {
                      const fb = quizResult.feedback?.[String(idx)]
                      return (
                        <div
                          key={idx}
                          className={cn(
                            'rounded-lg border p-4 text-sm',
                            fb?.correct
                              ? 'border-green-300 bg-green-50 dark:bg-green-950/20'
                              : 'border-red-300 bg-red-50 dark:bg-red-950/20',
                          )}
                        >
                          <p className="font-medium mb-1">
                            {idx + 1}. {q.question_text || q.question}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Your answer: <span className="font-medium">{quizAnswers[String(idx)] || '—'}</span>
                          </p>
                          {!fb?.correct && (
                            <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">
                              Correct: <span className="font-medium">{fb?.correct_answer}</span>
                            </p>
                          )}
                          {fb?.explanation && (
                            <p className="text-xs text-muted-foreground mt-1 italic">{fb.explanation}</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/student/lessons">Back to My Lessons</Link>
                  </Button>
                </Card>
              )}
            </section>
          )}
        </div>

        {/* Sidebar outline */}
        <aside className="hidden lg:block">
          <Card className="p-4 sticky top-32 border-muted">
            <p className="text-sm font-semibold mb-3">Outline</p>
            <nav className="space-y-1 max-h-[55vh] overflow-y-auto pr-1">
              {blocks.map((b, i) => (
                <a
                  key={b.id}
                  href={`#block-${b.id}`}
                  className={`flex gap-2 text-sm py-2 px-2 rounded-md hover:bg-muted transition-colors ${
                    doneIds.has(b.id) ? 'text-primary font-medium' : 'text-muted-foreground'
                  }`}
                >
                  <span className="tabular-nums text-xs w-5 shrink-0">{i + 1}.</span>
                  <span className="line-clamp-2">{b.title || b.block_type}</span>
                </a>
              ))}
            </nav>
            {allQuestions.length > 0 && (
              <Button
                className="w-full mt-4 gap-1"
                size="sm"
                variant={quizResult ? 'secondary' : 'default'}
                onClick={() => { setShowQuiz(true); setQuizResult(null) }}
              >
                <HelpCircle className="w-4 h-4" />
                {quizResult ? 'Retake quiz' : 'Take quiz'}
              </Button>
            )}
          </Card>
        </aside>
      </div>
    </div>
  )
}
