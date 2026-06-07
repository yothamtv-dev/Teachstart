'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Star, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'

type Attempt = {
  id: string
  lesson_id: string
  score: number
  total: number
  score_pct: number
  created_at: string
  lesson: { title: string; subject: string }
}

export default function StudentScoresPage() {
  const { user } = useAuth()
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    ;(async () => {
      const { data } = await supabase
        .from('quiz_attempts')
        .select('id, lesson_id, score, total, score_pct, created_at, lesson:lessons(title, subject)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setAttempts((data || []) as any[])
      setLoading(false)
    })()
  }, [user])

  const avg =
    attempts.length > 0
      ? Math.round(attempts.reduce((s, a) => s + (a.score_pct || 0), 0) / attempts.length)
      : null

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">My Quiz Scores</h1>
      {avg !== null && (
        <Card className="p-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-yellow-100 dark:bg-yellow-900/40 flex items-center justify-center">
            <Trophy className="w-7 h-7 text-yellow-600" />
          </div>
          <div>
            <p className="text-3xl font-bold">{avg}%</p>
            <p className="text-muted-foreground text-sm">Average score across {attempts.length} quiz{attempts.length === 1 ? '' : 'zes'}</p>
          </div>
        </Card>
      )}

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : attempts.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">
          <Star className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No quiz attempts yet. Open a lesson and take the quiz!</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {attempts.map((a) => {
            const pct = Math.round(a.score_pct)
            return (
              <Card key={a.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0',
                      pct >= 80
                        ? 'bg-green-500'
                        : pct >= 60
                        ? 'bg-yellow-500'
                        : 'bg-red-400',
                    )}
                  >
                    {pct}%
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{(a.lesson as any)?.title || 'Lesson'}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="secondary" className="text-xs">{(a.lesson as any)?.subject}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {a.score}/{a.total} correct
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(a.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <Progress value={pct} className="h-1.5 mt-2" />
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
