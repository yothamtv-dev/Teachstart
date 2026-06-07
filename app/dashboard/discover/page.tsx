'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { LEARNING_PATHS, lessonMatchesPath } from '@/lib/learning-paths'
import { CatalogLessonCard, PathHeroCard, type CatalogLesson } from '@/components/discover/catalog-lesson-card'
import { Compass, Sparkles } from 'lucide-react'

export default function DiscoverPage() {
  const { user } = useAuth()
  const [catalog, setCatalog] = useState<CatalogLesson[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [pathId, setPathId] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const q = new URLSearchParams(window.location.search).get('subject')
    if (q) setSubjectFilter(decodeURIComponent(q))
  }, [])

  useEffect(() => {
    if (!user) return

    const load = async () => {
      try {
        const { data: published } = await supabase
          .from('lessons')
          .select('id, title, description, subject, grade_level, duration_minutes, difficulty_level')
          .eq('is_published', true)
          .is('deleted_at', null)
          .order('updated_at', { ascending: false })
          .limit(80)

        const { data: peers } = await supabase
          .from('peer_lessons')
          .select('lesson_id, title, description, subject, grade_level, rating, rating_count')
          .eq('is_approved', true)
          .limit(40)

        const peerIds = [...new Set((peers || []).map((p) => p.lesson_id))]
        let durMap = new Map<string, { duration_minutes: number | null; difficulty_level: string | null }>()
        if (peerIds.length) {
          const { data: meta } = await supabase
            .from('lessons')
            .select('id, duration_minutes, difficulty_level')
            .in('id', peerIds)
          for (const row of meta || []) {
            durMap.set(row.id, {
              duration_minutes: row.duration_minutes,
              difficulty_level: row.difficulty_level,
            })
          }
        }

        const byId = new Map<string, CatalogLesson>()

        for (const row of published || []) {
          byId.set(row.id, {
            id: row.id,
            title: row.title,
            description: row.description,
            subject: row.subject,
            grade_level: row.grade_level,
            duration_minutes: row.duration_minutes,
            difficulty_level: row.difficulty_level,
            source: 'published',
          })
        }

        for (const p of peers || []) {
          if (byId.has(p.lesson_id)) {
            const cur = byId.get(p.lesson_id)!
            if (p.rating != null) {
              cur.rating = Number(p.rating)
              cur.rating_count = p.rating_count ?? undefined
            }
            continue
          }
          const m = durMap.get(p.lesson_id)
          byId.set(p.lesson_id, {
            id: p.lesson_id,
            title: p.title,
            description: p.description,
            subject: p.subject,
            grade_level: p.grade_level,
            duration_minutes: m?.duration_minutes,
            difficulty_level: m?.difficulty_level,
            rating: p.rating != null ? Number(p.rating) : undefined,
            rating_count: p.rating_count ?? undefined,
            source: 'peer',
          })
        }

        setCatalog([...byId.values()])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user])

  const path = pathId ? LEARNING_PATHS.find((p) => p.id === pathId) : null

  const filtered = useMemo(() => {
    let list = catalog
    if (path) {
      list = list.filter((l) =>
        lessonMatchesPath(
          {
            subject: l.subject,
            grade_level: l.grade_level,
            difficulty_level: l.difficulty_level || undefined,
          },
          path,
        ),
      )
    }
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.description?.toLowerCase().includes(q) ||
          l.subject.toLowerCase().includes(q),
      )
    }
    return list
  }, [catalog, path, search])

  const subjects = useMemo(() => {
    const s = new Set(catalog.map((c) => c.subject))
    return [...s].sort()
  }, [catalog])

  const [subjectFilter, setSubjectFilter] = useState<string | null>(null)

  const display = useMemo(() => {
    let list = filtered
    if (subjectFilter) list = list.filter((l) => l.subject === subjectFilter)
    return list
  }, [filtered, subjectFilter])

  return (
    <div className="min-h-full bg-gradient-to-b from-background to-muted/20">
      <div className="border-b bg-card/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="flex flex-col md:flex-row md:items-end gap-6 justify-between">
            <div>
              <Badge variant="secondary" className="mb-3 gap-1">
                <Compass className="w-3.5 h-3.5" />
                Discover
              </Badge>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                Learn like it&apos;s{' '}
                <span className="text-primary">Udemy, Coursera &amp; Udacity</span>
              </h1>
              <p className="mt-3 text-muted-foreground max-w-2xl leading-relaxed">
                Browsable catalog of published lessons, peer picks, and guided paths. Start any lesson in a focused
                player with video, outline, and progress — the way MOOCs were meant to feel.
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="w-4 h-4 text-amber-500" />
              {loading ? 'Loading catalog…' : `${catalog.length} experiences`}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        <section>
          <h2 className="text-lg font-semibold mb-4">Learning paths</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              type="button"
              onClick={() => setPathId(null)}
              className={`rounded-xl border p-4 text-left transition-colors ${
                pathId === null ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
              }`}
            >
              <p className="font-medium">Full catalog</p>
              <p className="text-xs text-muted-foreground mt-1">Everything published &amp; peer-listed</p>
            </button>
            {LEARNING_PATHS.map((p) => (
              <PathHeroCard key={p.id} path={p} onSelect={() => setPathId(pathId === p.id ? null : p.id)} />
            ))}
          </div>
          {path && (
            <p className="text-sm text-muted-foreground mt-3">
              Filtering by <span className="font-medium text-foreground">{path.title}</span>.{' '}
              <button type="button" className="text-primary underline" onClick={() => setPathId(null)}>
                Clear path
              </button>
            </p>
          )}
        </section>

        <section className="flex flex-col sm:flex-row gap-4 flex-wrap">
          <Input
            placeholder="Search lessons, topics, subjects…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={subjectFilter === null ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSubjectFilter(null)}
            >
              All subjects
            </Badge>
            {subjects.slice(0, 12).map((s) => (
              <Badge
                key={s}
                variant={subjectFilter === s ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSubjectFilter(subjectFilter === s ? null : s)}
              >
                {s}
              </Badge>
            ))}
          </div>
        </section>

        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : display.length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
            <p className="font-medium text-foreground mb-2">No lessons in this view yet</p>
            <p className="text-sm max-w-md mx-auto">
              Publish a lesson from the builder (&quot;List in Discover&quot;) or share one to the peer hub so others
              can open it here.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {display.map((lesson, i) => (
              <CatalogLessonCard key={lesson.id} lesson={lesson} bestseller={i < 3 && lesson.source === 'peer'} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
