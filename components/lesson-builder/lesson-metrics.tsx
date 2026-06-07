'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Loader, Sparkles, Clock, BookMarked, Recycle, CheckCircle2, XCircle } from 'lucide-react'
import { computeReusabilityScore } from '@/lib/reusability-score'
import { useProAccess } from '@/hooks/use-pro-access'
import { authenticatedFetch } from '@/lib/authenticated-fetch'
import { ProUpgradeBanner } from '@/components/pro-upgrade-banner'
import { toast } from 'sonner'

type AlignResult = {
  coverage_score: number
  aligned_standards: Array<{ standard_code: string; alignment_strength: string; rationale: string }>
  gaps: string[]
  mandatory_flags: Array<{ requirement: string; status: string; note: string }>
}

export function LessonMetrics({
  blocks,
  title,
  description,
  subject,
  gradeLevel,
  learningObjectives,
  lessonId,
}: {
  blocks: any[]
  title: string
  description?: string
  subject?: string
  gradeLevel?: string
  learningObjectives?: string[]
  lessonId?: string | null
}) {
  const [scores, setScores] = useState<any>(null)

  const reusability = useMemo(
    () =>
      computeReusabilityScore({
        title,
        description: description || '',
        subject: subject || '',
        gradeLevel: gradeLevel || '',
        learningObjectives: learningObjectives || [],
        blocks,
      }),
    [title, description, subject, gradeLevel, learningObjectives, blocks],
  )
  const [timeEstimate, setTimeEstimate] = useState<any>(null)
  const [align, setAlign] = useState<AlignResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingAlign, setLoadingAlign] = useState(false)
  const { isPro } = useProAccess()

  const handleCalculateMetrics = async () => {
    if (!isPro) {
      toast.error('Quality & time analysis is a Pro feature.')
      return
    }
    setLoading(true)
    try {
      const scoreRes = await authenticatedFetch('/api/calculate-score', {
        method: 'POST',
        body: JSON.stringify({ blocks, title }),
      })

      if (scoreRes.ok) {
        setScores(await scoreRes.json())
      }

      const timeRes = await authenticatedFetch('/api/estimate-time', {
        method: 'POST',
        body: JSON.stringify({ blocks }),
      })

      if (timeRes.ok) {
        setTimeEstimate(await timeRes.json())
      }
    } catch (error) {
      console.error('Error calculating metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCurriculumAlign = async () => {
    if (!isPro) {
      toast.error('Curriculum alignment is a Pro feature.')
      return
    }
    if (!blocks.length) return
    setLoadingAlign(true)
    try {
      const res = await authenticatedFetch('/api/curriculum-align', {
        method: 'POST',
        body: JSON.stringify({
          title,
          subject,
          gradeLevel,
          lessonId: lessonId || undefined,
          blocks: blocks.map((b) => ({
            type: b.type,
            title: b.title,
            content: b.content,
            duration: b.duration,
            learning_objectives: b.learning_objectives,
          })),
        }),
      })
      if (res.ok) {
        setAlign(await res.json())
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingAlign(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-orange-600'
  }

  return (
    <Card className="p-4 space-y-4">
      {/* Live Reusability Score */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold flex items-center gap-1.5">
            <Recycle className="w-4 h-4 text-primary" /> Reusability Score
          </p>
          <Badge
            variant="outline"
            className={
              reusability.color === 'success'
                ? 'border-green-500 text-green-700 dark:text-green-400'
                : reusability.color === 'warning'
                ? 'border-yellow-500 text-yellow-700 dark:text-yellow-400'
                : 'border-red-500 text-red-700 dark:text-red-400'
            }
          >
            {reusability.score}% · {reusability.label}
          </Badge>
        </div>
        <Progress
          value={reusability.score}
          className={`h-2 ${
            reusability.color === 'success'
              ? '[&>div]:bg-green-500'
              : reusability.color === 'warning'
              ? '[&>div]:bg-yellow-500'
              : '[&>div]:bg-red-500'
          }`}
        />
        <div className="space-y-1 text-xs">
          {reusability.details.map((d) => (
            <div key={d.criterion} className="flex items-start gap-1.5">
              {d.met ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
              )}
              <span className={d.met ? 'text-foreground/80' : 'text-muted-foreground'}>
                {d.criterion}
              </span>
            </div>
          ))}
        </div>
      </div>

      {!isPro && <ProUpgradeBanner compact />}

      <Button
        onClick={handleCalculateMetrics}
        disabled={loading || blocks.length === 0 || !isPro}
        className="w-full"
        variant="outline"
        type="button"
      >
        {loading ? (
          <>
            <Loader className="w-4 h-4 mr-2 animate-spin" />
            Analyzing…
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            Quality & time
          </>
        )}
      </Button>

      <Button
        onClick={handleCurriculumAlign}
        disabled={loadingAlign || blocks.length === 0 || !isPro}
        className="w-full"
        variant="secondary"
        type="button"
      >
        {loadingAlign ? (
          <>
            <Loader className="w-4 h-4 mr-2 animate-spin" />
            Aligning…
          </>
        ) : (
          <>
            <BookMarked className="w-4 h-4 mr-2" />
            Curriculum alignment
          </>
        )}
      </Button>

      {align && (
        <div className="text-xs space-y-2 border-t pt-3">
          <div className="flex justify-between items-center">
            <span className="font-medium">Coverage</span>
            <span className="font-bold text-primary">{align.coverage_score}%</span>
          </div>
          {align.aligned_standards.slice(0, 4).map((a, i) => (
            <div key={i} className="rounded border p-2 bg-muted/40">
              <div className="flex gap-1 flex-wrap mb-0.5">
                <code className="text-[10px] bg-background px-1 rounded">{a.standard_code}</code>
                <Badge variant="outline" className="text-[10px] h-5 capitalize">
                  {a.alignment_strength}
                </Badge>
              </div>
              <p className="text-muted-foreground line-clamp-2">{a.rationale}</p>
            </div>
          ))}
          {align.gaps.length > 0 && (
            <div>
              <p className="font-medium text-amber-800 mb-1">Gaps</p>
              <ul className="list-disc pl-4 text-muted-foreground space-y-0.5">
                {align.gaps.slice(0, 3).map((g, i) => (
                  <li key={i}>{g}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {scores && (
        <div className="space-y-3 text-sm border-t pt-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="font-medium">Overall quality</span>
              <span className={`font-bold ${getScoreColor(scores.overall_score)}`}>{scores.overall_score}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  scores.overall_score >= 80 ? 'bg-green-600' : scores.overall_score >= 60 ? 'bg-yellow-600' : 'bg-orange-600'
                }`}
                style={{ width: `${scores.overall_score}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/40 rounded">
              <p className="text-muted-foreground">Reusability</p>
              <p className="font-bold text-blue-600">{scores.reusability_score}%</p>
            </div>
            <div className="p-2 bg-purple-50 dark:bg-purple-950/40 rounded">
              <p className="text-muted-foreground">Clarity</p>
              <p className="font-bold text-purple-600">{scores.clarity_score}%</p>
            </div>
            <div className="p-2 bg-green-50 dark:bg-green-950/40 rounded">
              <p className="text-muted-foreground">Engagement</p>
              <p className="font-bold text-green-600">{scores.engagement_score}%</p>
            </div>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/40 rounded">
              <p className="text-muted-foreground">Completeness</p>
              <p className="font-bold text-amber-700">{scores.completeness_score}%</p>
            </div>
          </div>

          {scores.recommendations?.length > 0 && (
            <div>
              <p className="font-medium mb-2">Recommendations</p>
              <ul className="space-y-1 text-xs text-muted-foreground">
                {scores.recommendations.slice(0, 3).map((rec: string, i: number) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-primary flex-shrink-0">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {timeEstimate && (
        <div className="space-y-2 text-sm border-t pt-4">
          <p className="font-medium flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Bell schedule fit
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-muted-foreground">Reading</p>
              <p className="font-bold">{timeEstimate.reading_time} min</p>
            </div>
            <div>
              <p className="text-muted-foreground">Activities</p>
              <p className="font-bold">{timeEstimate.activity_time} min</p>
            </div>
            <div>
              <p className="text-muted-foreground">Discussion</p>
              <p className="font-bold">{timeEstimate.discussion_time} min</p>
            </div>
            <div>
              <p className="text-muted-foreground">Assessment</p>
              <p className="font-bold">{timeEstimate.assessment_time} min</p>
            </div>
          </div>
          <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded">
            <p className="text-muted-foreground text-xs">Total</p>
            <p className="font-bold text-blue-600">{timeEstimate.total_time} minutes</p>
          </div>
          {timeEstimate.justification && (
            <p className="text-xs text-muted-foreground italic">{timeEstimate.justification}</p>
          )}
        </div>
      )}
    </Card>
  )
}
