'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, Star, PlayCircle, Award } from 'lucide-react'
import { catalogRatingSeed } from '@/lib/learning-paths'
import { cn } from '@/lib/utils'

function thumbGradient(title: string) {
  let h = 0
  for (let i = 0; i < title.length; i++) h = (h * 33 + title.charCodeAt(i)) >>> 0
  const hues = [220, 280, 160, 30, 340, 200]
  const h1 = hues[h % hues.length]
  const h2 = hues[(h >> 3) % hues.length]
  return `linear-gradient(135deg, hsl(${h1}, 55%, 38%) 0%, hsl(${h2}, 50%, 22%) 100%)`
}

export type CatalogLesson = {
  id: string
  title: string
  description: string | null
  subject: string
  grade_level: string
  duration_minutes?: number | null
  difficulty_level?: string | null
  rating?: number | null
  rating_count?: number | null
  source: 'published' | 'peer'
}

export function CatalogLessonCard({ lesson, bestseller }: { lesson: CatalogLesson; bestseller?: boolean }) {
  const dur = lesson.duration_minutes ?? 45
  const seed = catalogRatingSeed(lesson.id)
  const rating = lesson.rating ?? seed.value
  const count = lesson.rating_count ?? seed.count
  const diff = lesson.difficulty_level || 'medium'

  return (
    <Card className="group overflow-hidden border-muted/80 hover:border-primary/40 hover:shadow-lg transition-all duration-300 flex flex-col h-full bg-card">
      <div
        className="aspect-[16/9] relative flex items-end p-4 text-white"
        style={{ background: thumbGradient(lesson.title) }}
      >
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
        <PlayCircle className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 opacity-90 drop-shadow-md" />
        <div className="relative z-10 flex flex-wrap gap-1 w-full">
          {bestseller && (
            <Badge className="bg-amber-500 text-white border-0 gap-1">
              <Award className="w-3 h-3" />
              Popular
            </Badge>
          )}
          <Badge variant="secondary" className="bg-white/20 text-white border-0 backdrop-blur-sm">
            {lesson.subject}
          </Badge>
        </div>
      </div>
      <div className="p-4 flex flex-col flex-1 gap-2">
        <h3 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {lesson.title}
        </h3>
        {lesson.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{lesson.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span className="font-medium text-foreground">{rating.toFixed(1)}</span>
            <span>({count.toLocaleString()})</span>
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {dur} min
          </span>
          <Badge variant="outline" className="text-[10px] h-5 capitalize">
            {diff}
          </Badge>
        </div>
        <p className="text-[11px] text-muted-foreground">Grade band: {lesson.grade_level}</p>
        <Button className="w-full mt-auto" size="sm" asChild>
          <Link href={`/dashboard/learn/${lesson.id}`}>Start learning</Link>
        </Button>
      </div>
    </Card>
  )
}

export function PathHeroCard({
  path,
  onSelect,
}: {
  path: import('@/lib/learning-paths').LearningPath
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'relative overflow-hidden rounded-xl p-6 text-left text-white shadow-lg hover:scale-[1.02] transition-transform w-full min-h-[140px]',
        `bg-gradient-to-br ${path.accent}`,
      )}
    >
      <Badge variant="secondary" className="mb-2 bg-white/20 text-white border-0 text-[10px]">
        {path.partnerStyle} style track
      </Badge>
      <h3 className="text-lg font-bold leading-tight pr-8">{path.title}</h3>
      <p className="text-sm text-white/85 mt-1 line-clamp-2">{path.subtitle}</p>
      <span className="inline-flex mt-3 text-xs font-medium underline decoration-white/60">
        Browse this path →
      </span>
    </button>
  )
}
