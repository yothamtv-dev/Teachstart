'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useProAccess } from '@/hooks/use-pro-access'
import { authenticatedFetch } from '@/lib/authenticated-fetch'
import { ProUpgradeBanner } from '@/components/pro-upgrade-banner'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BookMarked,
  Loader2,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Target,
  LayoutList,
} from 'lucide-react'

type AlignResult = {
  coverage_score: number
  aligned_standards: Array<{ standard_code: string; alignment_strength: string; rationale: string }>
  gaps: string[]
  mandatory_flags: Array<{ requirement: string; status: string; note: string }>
}

type GapResult = {
  summary: string
  missing_topics: string[]
  pacing_risks: string[]
  assessment_gaps: string[]
  proactive_alerts: Array<{ severity: string; message: string; suggestion: string }>
  suggested_next_lessons: string[]
  lessons_analyzed: number
}

export default function CurriculumHubPage() {
  const { user } = useAuth()
  const { isPro } = useProAccess()
  const [lessons, setLessons] = useState<{ id: string; title: string; subject: string; grade_level: string }[]>([])
  const [selectedLessonId, setSelectedLessonId] = useState<string>('')
  const [alignResult, setAlignResult] = useState<AlignResult | null>(null)
  const [gapResult, setGapResult] = useState<GapResult | null>(null)
  const [loadingAlign, setLoadingAlign] = useState(false)
  const [loadingGaps, setLoadingGaps] = useState(false)
  const [standardsCount, setStandardsCount] = useState<number | null>(null)

  useEffect(() => {
    if (!user) return
    ;(async () => {
      const { data } = await supabase
        .from('lessons')
        .select('id, title, subject, grade_level')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false })
        .limit(40)
      setLessons(data || [])
      if (data?.[0]) setSelectedLessonId(data[0].id)

      const { count } = await supabase
        .from('curriculum_standards')
        .select('*', { count: 'exact', head: true })
      setStandardsCount(count)
    })()
  }, [user])

  const runAlignment = async () => {
    if (!isPro) {
      toast.error('Curriculum alignment is a Pro feature.')
      return
    }
    if (!selectedLessonId) return
    setLoadingAlign(true)
    setAlignResult(null)
    try {
      const { data: lesson } = await supabase.from('lessons').select('*').eq('id', selectedLessonId).single()
      const { data: blocks } = await supabase
        .from('lesson_blocks')
        .select('*')
        .eq('lesson_id', selectedLessonId)
        .order('position', { ascending: true })

      const payloadBlocks = (blocks || []).map((b) => ({
        type: b.block_type,
        title: b.title,
        content: b.content,
        duration: b.duration_minutes,
        learning_objectives: (b.metadata as any)?.learning_objectives,
      }))

      if (!payloadBlocks.length) {
        setAlignResult({
          coverage_score: 0,
          aligned_standards: [],
          gaps: ['This lesson has no blocks yet. Add blocks in the lesson builder, then run alignment again.'],
          mandatory_flags: [],
        })
        return
      }

      const res = await authenticatedFetch('/api/curriculum-align', {
        method: 'POST',
        body: JSON.stringify({
          title: lesson?.title,
          subject: lesson?.subject,
          gradeLevel: lesson?.grade_level,
          blocks: payloadBlocks,
          lessonId: selectedLessonId,
        }),
      })

      if (!res.ok) throw new Error('Alignment failed')
      setAlignResult(await res.json())
    } catch (e) {
      console.error(e)
      setAlignResult({
        coverage_score: 0,
        aligned_standards: [],
        gaps: ['Could not run alignment. Check your connection and OpenAI configuration.'],
        mandatory_flags: [],
      })
    } finally {
      setLoadingAlign(false)
    }
  }

  const runGapScan = async () => {
    if (!isPro) {
      toast.error('Plan gap analysis is a Pro feature.')
      return
    }
    setLoadingGaps(true)
    setGapResult(null)
    try {
      const res = await authenticatedFetch('/api/plan-gap-analysis', {
        method: 'POST',
        body: JSON.stringify({ limit: 15, user_id: user?.id }),
      })
      if (!res.ok) throw new Error('Gap analysis failed')
      setGapResult(await res.json())
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingGaps(false)
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <BookMarked className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Curriculum intelligence</h1>
            <p className="text-muted-foreground mt-1">
              Map lessons to your standards database, validate mandatory elements, and scan multi-lesson gaps before
              testing windows.
            </p>
          </div>
        </div>
        {standardsCount !== null && (
          <p className="text-sm text-muted-foreground mt-2">
            <span className="font-medium text-foreground">{standardsCount}</span> standards available in{' '}
            <code className="text-xs bg-muted px-1 rounded">curriculum_standards</code> — expand the seed set in Supabase
            anytime.
          </p>
        )}
      </div>

      {!isPro && <ProUpgradeBanner />}

      <Tabs defaultValue="align" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="align" className="gap-2">
            <Target className="w-4 h-4" />
            Lesson alignment
          </TabsTrigger>
          <TabsTrigger value="gaps" className="gap-2">
            <LayoutList className="w-4 h-4" />
            Plan gap scan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="align" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              Instant validation
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Compares block text and objectives against your centralized standards. Strong matches can be persisted to{' '}
              <code className="text-xs bg-muted px-1 rounded">lesson_standards</code> (run the SQL patch in{' '}
              <code className="text-xs bg-muted px-1 rounded">scripts/patches</code> if inserts fail).
            </p>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
              <div className="flex-1 w-full">
                <label className="text-sm font-medium">Lesson</label>
                <select
                  className="mt-1 w-full h-10 rounded-md border bg-background px-3 text-sm"
                  value={selectedLessonId}
                  onChange={(e) => setSelectedLessonId(e.target.value)}
                >
                  {lessons.length === 0 && <option value="">No lessons yet</option>}
                  {lessons.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.title} — {l.subject} ({l.grade_level})
                    </option>
                  ))}
                </select>
              </div>
              <Button onClick={runAlignment} disabled={!selectedLessonId || loadingAlign || !isPro} className="gap-2">
                {loadingAlign ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Run alignment
              </Button>
            </div>
          </Card>

          {alignResult && (
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="p-6">
                <h3 className="font-semibold mb-2">Coverage score</h3>
                <div className="text-4xl font-bold text-primary mb-2">{alignResult.coverage_score}%</div>
                <p className="text-sm text-muted-foreground">Estimated alignment depth for this lesson draft.</p>
              </Card>
              <Card className="p-6">
                <h3 className="font-semibold mb-3">Mandatory checklist</h3>
                <ul className="space-y-2">
                  {alignResult.mandatory_flags.length === 0 && (
                    <li className="text-sm text-muted-foreground">No flags returned.</li>
                  )}
                  {alignResult.mandatory_flags.map((m, i) => (
                    <li key={i} className="text-sm flex gap-2 items-start">
                      <Badge
                        variant={m.status === 'met' ? 'default' : m.status === 'partial' ? 'secondary' : 'destructive'}
                        className="shrink-0 capitalize"
                      >
                        {m.status}
                      </Badge>
                      <span>
                        <span className="font-medium">{m.requirement}</span> — {m.note}
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
              <Card className="p-6 md:col-span-2">
                <h3 className="font-semibold mb-3">Standards touched</h3>
                <div className="space-y-3">
                  {alignResult.aligned_standards.map((a, i) => (
                    <div key={i} className="border rounded-lg p-3 text-sm">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <code className="text-xs bg-muted px-1 rounded">{a.standard_code}</code>
                        <Badge variant="outline" className="capitalize">
                          {a.alignment_strength}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground">{a.rationale}</p>
                    </div>
                  ))}
                  {alignResult.aligned_standards.length === 0 && (
                    <p className="text-sm text-muted-foreground">No standard codes matched — broaden lesson objectives or add standards to the database.</p>
                  )}
                </div>
              </Card>
              <Card className="p-6 md:col-span-2 border-amber-200 bg-amber-50/50">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-amber-900">
                  <AlertTriangle className="w-4 h-4" />
                  Gaps & under-addressed areas
                </h3>
                <ul className="list-disc pl-5 space-y-1 text-sm text-amber-950">
                  {alignResult.gaps.map((g, i) => (
                    <li key={i}>{g}</li>
                  ))}
                </ul>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="gaps" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-2">Holistic plan analysis</h2>
            <p className="text-sm text-muted-foreground mb-4">
              AI reviews your recent lessons together — not just one file — to surface redundancy, pacing risk, and
              assessment blind spots before high-stakes periods.
            </p>
            <Button onClick={runGapScan} disabled={loadingGaps || !isPro} variant="secondary" className="gap-2">
              {loadingGaps ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Analyze my recent lessons
            </Button>
          </Card>

          {gapResult && (
            <div className="space-y-6">
              <Card className="p-6">
                <p className="text-sm text-muted-foreground mb-1">Lessons analyzed: {gapResult.lessons_analyzed}</p>
                <p className="text-base leading-relaxed">{gapResult.summary}</p>
              </Card>
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h3 className="font-semibold mb-2">Missing topics</h3>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    {gapResult.missing_topics.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </Card>
                <Card className="p-6">
                  <h3 className="font-semibold mb-2">Assessment gaps</h3>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    {gapResult.assessment_gaps.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </Card>
                {gapResult.pacing_risks?.length > 0 && (
                  <Card className="p-6 md:col-span-2">
                    <h3 className="font-semibold mb-2">Pacing & load risks</h3>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      {gapResult.pacing_risks.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </Card>
                )}
                <Card className="p-6 md:col-span-2">
                  <h3 className="font-semibold mb-2">Proactive alerts</h3>
                  <div className="space-y-3">
                    {gapResult.proactive_alerts.map((a, i) => (
                      <div
                        key={i}
                        className={`rounded-lg border p-3 text-sm ${
                          a.severity === 'critical'
                            ? 'border-red-200 bg-red-50'
                            : a.severity === 'warning'
                              ? 'border-amber-200 bg-amber-50'
                              : 'border-blue-200 bg-blue-50/60'
                        }`}
                      >
                        <Badge variant="outline" className="mb-1 capitalize">
                          {a.severity}
                        </Badge>
                        <p className="font-medium">{a.message}</p>
                        <p className="text-muted-foreground mt-1">{a.suggestion}</p>
                      </div>
                    ))}
                  </div>
                </Card>
                <Card className="p-6 md:col-span-2">
                  <h3 className="font-semibold mb-2">Suggested next lessons</h3>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    {gapResult.suggested_next_lessons.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
