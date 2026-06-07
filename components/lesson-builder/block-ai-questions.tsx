'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Wand2 } from 'lucide-react'
import { toast } from 'sonner'
import { useProAccess } from '@/hooks/use-pro-access'
import { authenticatedFetch } from '@/lib/authenticated-fetch'
import { ProUpgradeBanner } from '@/components/pro-upgrade-banner'

type Q = {
  question_text: string
  question_type: string
  options?: string[]
  correct_index?: number
  correct_boolean?: boolean
  correct_text?: string
  explanation: string
  bloom_level?: string
}

export function BlockAiQuestions({ block, onUpdate }: { block: any; onUpdate: (u: any) => void }) {
  const { isPro } = useProAccess()
  const [loading, setLoading] = useState(false)
  const [qType, setQType] = useState<'multiple_choice' | 'short_answer' | 'true_false'>('multiple_choice')
  const [count, setCount] = useState(4)

  const existing: Q[] = block.metadata?.generated_questions || []

  const run = async () => {
    const content = `${block.title || ''}\n\n${block.content || ''}`.trim()
    if (!content) {
      toast.error('Add block content first so AI has context.')
      return
    }
    setLoading(true)
    try {
      const res = await authenticatedFetch('/api/generate-questions', {
        method: 'POST',
        body: JSON.stringify({
          content,
          questionCount: count,
          questionType: qType,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        if (res.status === 403 && data?.error === 'pro_required') {
          toast.error(data.message, { duration: 8000 })
          return
        }
        throw new Error(data?.message || 'Request failed')
      }
      const questions: Q[] = data.questions || []
      onUpdate({
        metadata: {
          ...block.metadata,
          generated_questions: questions,
        },
      })
      toast.success(`Generated ${questions.length} questions`)
    } catch (e) {
      console.error(e)
      toast.error('Could not generate questions')
    } finally {
      setLoading(false)
    }
  }

  if (!isPro) {
    return <ProUpgradeBanner compact className="bg-gradient-to-br from-violet-50/80 to-background dark:from-violet-950/30" />
  }

  return (
    <div className="rounded-lg border bg-gradient-to-br from-violet-50/80 to-background dark:from-violet-950/30 p-3 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Wand2 className="w-4 h-4 text-violet-600" />
        AI question bank
      </div>
      <p className="text-xs text-muted-foreground">
        Builds formative items from this block&apos;s text. Stored in block metadata for export & preview.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] uppercase text-muted-foreground">Type</label>
          <select
            className="mt-0.5 w-full h-8 text-xs rounded-md border bg-background px-2"
            value={qType}
            onChange={(e) => setQType(e.target.value as typeof qType)}
          >
            <option value="multiple_choice">Multiple choice</option>
            <option value="short_answer">Short answer</option>
            <option value="true_false">True / false</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] uppercase text-muted-foreground">Count</label>
          <input
            type="number"
            min={1}
            max={10}
            className="mt-0.5 w-full h-8 text-xs rounded-md border bg-background px-2"
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value, 10) || 4)}
          />
        </div>
      </div>
      <Button type="button" size="sm" className="w-full gap-2" onClick={run} disabled={loading}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
        Generate
      </Button>
      {existing.length > 0 && (
        <ul className="text-[11px] space-y-2 max-h-40 overflow-y-auto border-t pt-2">
          {existing.slice(0, 5).map((q, i) => (
            <li key={i} className="text-muted-foreground">
              <span className="font-medium text-foreground">{i + 1}.</span> {q.question_text}
            </li>
          ))}
          {existing.length > 5 && (
            <li className="italic text-muted-foreground">+{existing.length - 5} more…</li>
          )}
        </ul>
      )}
    </div>
  )
}
