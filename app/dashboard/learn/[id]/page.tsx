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
  Share2,
} from 'lucide-react'
import { toast } from 'sonner'

type BlockRow = {
  id: string
  block_type: string
  title: string | null
  content: string | null
  position: number
  duration_minutes: number | null
  metadata: Record<string, unknown> | null
}

function progressKey(lessonId: string) {
  return `teachsmart-learn:${lessonId}`
}

export default function LessonPlayerPage() {
  const params = useParams()
  const { user, loading: authLoading } = useAuth()
  const lessonId = params.id as string

  const [lesson, setLesson] = useState<any>(null)
  const [blocks, setBlocks] = useState<BlockRow[]>([])
  const [loading, setLoading] = useState(true)
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set())

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
          if (le) console.error('[learn] lessons select:', le.message, le.code)
          setLesson(null)
          setBlocks([])
          return
        }
        setLesson(l)

        const { data: b, error: be } = await supabase
          .from('lesson_blocks')
          .select('*')
          .eq('lesson_id', lessonId)
          .order('position', { ascending: true })
        if (cancelled) return
        if (be) console.error('[learn] lesson_blocks select:', be.message, be.code)
        setBlocks(b || [])
      } catch (e) {
        console.error(e)
        if (!cancelled) {
          setLesson(null)
          setBlocks([])
        }
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
      if (raw) {
        const j = JSON.parse(raw)
        setDoneIds(new Set(j.sections || []))
      }
    } catch {
      /* ignore */
    }
  }, [lessonId])

  const toggleSection = (blockId: string) => {
    const next = new Set(doneIds)
    if (next.has(blockId)) next.delete(blockId)
    else next.add(blockId)
    setDoneIds(next)
    try {
      localStorage.setItem(progressKey(lessonId), JSON.stringify({ sections: [...next], at: Date.now() }))
    } catch {
      /* ignore */
    }
  }

  const progressPct = blocks.length ? Math.round((doneIds.size / blocks.length) * 100) : 0
  const isOwner = user?.id === lesson?.user_id

  const nextLessonHref = useMemo(() => {
    if (!lesson) return null
    return `/dashboard/discover?subject=${encodeURIComponent(lesson.subject)}`
  }, [lesson])

  if (loading || authLoading) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        <p>Opening lesson…</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-12 text-center max-w-md mx-auto space-y-4">
        <p className="text-muted-foreground">Sign in to open this lesson.</p>
        <Button asChild variant="outline">
          <Link href={`/auth/login?next=/dashboard/learn/${lessonId}`}>Sign in</Link>
        </Button>
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="p-12 text-center max-w-md mx-auto space-y-4">
        <p className="text-muted-foreground">
          This lesson isn&apos;t available. The link may be wrong, the lesson was deleted, or your account doesn&apos;t
          have access (e.g. a draft someone shared — students need it assigned or published).
        </p>
        <Button asChild variant="outline">
          <Link href="/dashboard/discover">Back to Discover</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-background">
      <div className="border-b bg-card/90 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Button variant="ghost" size="sm" className="gap-1 shrink-0" asChild>
              <Link href="/dashboard/discover">
                <ArrowLeft className="w-4 h-4" />
                Catalog
              </Link>
            </Button>
            <span className="text-muted-foreground hidden sm:inline">|</span>
            <p className="text-sm font-medium truncate">{lesson.title}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              type="button"
              onClick={() => {
                const url = `${window.location.origin}/dashboard/learn/${lessonId}`
                void navigator.clipboard.writeText(url)
                toast.success('Link copied')
              }}
            >
              <Share2 className="w-4 h-4" />
              Share
            </Button>
            {isOwner && (
              <Button size="sm" className="gap-1" asChild>
                <Link href={`/dashboard/builder?id=${lessonId}`}>Edit lesson</Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 grid lg:grid-cols-[1fr_320px] gap-8">
        <div className="space-y-8 min-w-0">
          <header className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{lesson.subject}</Badge>
              <Badge variant="outline">{lesson.grade_level}</Badge>
              <Badge variant="outline" className="capitalize">
                {lesson.difficulty_level || 'mixed'}
              </Badge>
              <span className="text-sm text-muted-foreground inline-flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {lesson.duration_minutes ?? 45} min
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{lesson.title}</h1>
            {lesson.description && <p className="text-lg text-muted-foreground leading-relaxed">{lesson.description}</p>}
            {lesson.learning_objectives?.length > 0 && (
              <Card className="p-4 bg-muted/40 border-dashed">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  What you&apos;ll take away
                </p>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  {lesson.learning_objectives.map((o: string, i: number) => (
                    <li key={i}>{o}</li>
                  ))}
                </ul>
              </Card>
            )}
          </header>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Your progress</span>
              <span className="font-medium">{progressPct}%</span>
            </div>
            <Progress value={progressPct} className="h-2" />
          </div>

          <section className="space-y-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <ListOrdered className="w-5 h-5" />
              Lesson sequence
            </h2>
            {blocks.map((b, idx) => {
              const meta = (b.metadata || {}) as any
              const qs = meta.generated_questions as any[] | undefined
              const completed = doneIds.has(b.id)
              return (
                <article
                  key={b.id}
                  id={`block-${b.id}`}
                  className="rounded-xl border bg-card shadow-sm scroll-mt-28 overflow-hidden"
                >
                  <div className="flex items-start gap-3 p-4 border-b bg-muted/30">
                    <button
                      type="button"
                      onClick={() => toggleSection(b.id)}
                      className="mt-0.5 text-primary hover:opacity-80"
                      aria-label={completed ? 'Mark incomplete' : 'Mark complete'}
                    >
                      {completed ? (
                        <CheckCircle2 className="w-6 h-6" />
                      ) : (
                        <Circle className="w-6 h-6 text-muted-foreground" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Section {idx + 1} · {b.block_type}
                      </p>
                      <h3 className="text-xl font-semibold leading-snug">{b.title || 'Untitled section'}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{b.duration_minutes ?? '—'} min planned</p>
                    </div>
                  </div>
                  <div className="p-4 md:p-6 space-y-4">
                    {meta.video_url && (
                      <SmartVideoEmbed url={meta.video_url} title={b.title || 'Lesson video'} />
                    )}
                    {b.content?.trim() ? (
                      <LessonRichContent
                        content={b.content}
                        skipVideoUrls={meta.video_url ? [String(meta.video_url)] : []}
                      />
                    ) : (
                      !meta.video_url && (
                        <p className="text-sm italic text-muted-foreground">No narrative for this section.</p>
                      )
                    )}
                    {meta.attachments?.length > 0 && (
                      <div className="text-sm space-y-4">
                        <p className="font-medium">Resources</p>
                        <ul className="space-y-1">
                          {meta.attachments.map((a: { title: string; url: string }, i: number) => (
                            <li key={i}>
                              {!isPlayableVideoUrl(a.url) ? (
                                <a href={a.url} className="text-primary underline" target="_blank" rel="noreferrer">
                                  {a.title}
                                </a>
                              ) : (
                                <span className="text-muted-foreground">{a.title}</span>
                              )}
                            </li>
                          ))}
                        </ul>
                        {meta.attachments
                          .filter((a: { url: string }) => isPlayableVideoUrl(a.url))
                          .map((a: { title: string; url: string }, i: number) => (
                            <SmartVideoEmbed key={`att-${b.id}-${i}`} url={a.url} title={a.title} />
                          ))}
                      </div>
                    )}
                    {qs && qs.length > 0 && (
                      <Card className="p-4 bg-violet-50/50 dark:bg-violet-950/20 border-violet-200/60 dark:border-violet-900">
                        <p className="font-medium text-sm mb-3">Practice check</p>
                        <ol className="list-decimal pl-5 space-y-3 text-sm">
                          {qs.map((q, i) => (
                            <li key={i}>
                              <p className="font-medium">{q.question_text || q.question}</p>
                              {q.options && (
                                <ul className="mt-1 list-disc pl-5 text-muted-foreground">
                                  {q.options.map((opt: string, j: number) => (
                                    <li key={j}>{opt}</li>
                                  ))}
                                </ul>
                              )}
                              {q.explanation && (
                                <p className="text-xs text-muted-foreground mt-1 italic">{q.explanation}</p>
                              )}
                            </li>
                          ))}
                        </ol>
                      </Card>
                    )}
                  </div>
                </article>
              )
            })}
            {blocks.length === 0 && (
              <p className="text-muted-foreground">This lesson has no sections yet.</p>
            )}
          </section>

          <div className="flex flex-wrap gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setDoneIds(new Set(blocks.map((b) => b.id)))
                try {
                  localStorage.setItem(
                    progressKey(lessonId),
                    JSON.stringify({ sections: blocks.map((b) => b.id), at: Date.now() }),
                  )
                } catch {
                  /* ignore */
                }
                toast.success('Marked all sections complete')
              }}
            >
              Mark entire lesson complete
            </Button>
            {nextLessonHref && (
              <Button variant="outline" asChild>
                <Link href={nextLessonHref}>More in {lesson.subject}</Link>
              </Button>
            )}
          </div>
        </div>

        <aside className="lg:block space-y-4">
          <Card className="p-4 sticky top-24 border-muted">
            <p className="text-sm font-semibold mb-3">Outline</p>
            <nav className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
              {blocks.map((b, i) => (
                <a
                  key={b.id}
                  href={`#block-${b.id}`}
                  className={`flex gap-2 text-sm py-2 px-2 rounded-md hover:bg-muted transition-colors ${
                    doneIds.has(b.id) ? 'text-primary font-medium' : 'text-muted-foreground'
                  }`}
                >
                  <span className="tabular-nums text-xs w-6 shrink-0">{i + 1}.</span>
                  <span className="line-clamp-2">{b.title || b.block_type}</span>
                </a>
              ))}
            </nav>
          </Card>
        </aside>
      </div>
    </div>
  )
}
