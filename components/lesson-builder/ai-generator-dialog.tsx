'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Sparkles, Loader, AlertTriangle, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { useProAccess } from '@/hooks/use-pro-access'
import { authenticatedFetch } from '@/lib/authenticated-fetch'
import { ProUpgradeBanner } from '@/components/pro-upgrade-banner'

export function AIGeneratorDialog({
  onBlocksGenerated,
}: {
  onBlocksGenerated: (
    blocks: any[],
    meta?: { title?: string; description?: string; learning_objectives?: string[] },
  ) => void
}) {
  const [open, setOpen] = useState(false)
  const [topic, setTopic] = useState('')
  const [gradeLevel, setGradeLevel] = useState('')
  const [subject, setSubject] = useState('')
  const [duration, setDuration] = useState('45')
  const [loading, setLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [aiConfigured, setAiConfigured] = useState<boolean | null>(null)
  const [aiProvider, setAiProvider] = useState<string>('')
  const { isPro, loading: proLoading } = useProAccess()

  useEffect(() => {
    if (!open) return
    authenticatedFetch('/api/ai-status')
      .then((r) => r.json())
      .then((d) => { setAiConfigured(d.configured); setAiProvider(d.provider) })
      .catch(() => setAiConfigured(false))
  }, [open])

  const handleGenerate = async () => {
    if (!topic.trim()) { toast.error('Please enter a topic'); return }

    setLoading(true)
    setStreamingContent('')

    try {
      const response = await authenticatedFetch('/api/generate-lesson', {
        method: 'POST',
        body: JSON.stringify({
          topic,
          gradeLevel: gradeLevel || undefined,
          subject: subject || undefined,
          duration: parseInt(duration) || 45,
        }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok || data?.error) {
        const msg: string = data?.message || `Generation failed (${response.status})`
        if (response.status === 403 && data?.error === 'pro_required') {
          toast.error(data.message, { duration: 8000 })
        } else if (response.status === 503) {
          setAiConfigured(false)
          toast.error('AI is not configured. Add an API key and restart.')
        } else if (response.status === 429) {
          const delay = data?.retry_after
          toast.error(delay ? `Quota exceeded — retry in ${delay}s` : msg, { duration: 10000 })
        } else if (response.status === 404 && data?.error === 'model_not_found') {
          toast.error(
            'Gemini model not found. Add GOOGLE_GEMINI_MODEL=gemini-pro to .env.local and restart, or use OpenAI instead.',
            { duration: 12000 },
          )
        } else if (response.status === 401) {
          toast.error('Invalid or expired API key. Check your .env.local.', { duration: 8000 })
        } else {
          toast.error(msg, { duration: 8000 })
        }
        return
      }

      if (!data?.blocks?.length) {
        toast.error('AI returned an unexpected format. Please try again.')
        return
      }

      const blocks = data.blocks.map((block: any, index: number) => ({
        id: `block_${Date.now()}_${index}`,
        type: block.type,
        title: block.title,
        content: block.content,
        duration: block.duration,
        order: index,
        metadata: { learning_objectives: block.learning_objectives || [] },
      }))

      onBlocksGenerated(blocks, {
        title: data.title,
        description: data.description,
        learning_objectives: data.learning_objectives,
      })
      toast.success(`Generated ${blocks.length} blocks`)
      setOpen(false)
      resetForm()
    } catch (error: any) {
      console.error('AI generation error:', error)
      toast.error(error.message || 'Failed to generate lesson. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setTopic('')
    setGradeLevel('')
    setSubject('')
    setDuration('45')
    setStreamingContent('')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="gap-2">
          <Sparkles className="w-4 h-4" />
          AI Generator
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Generate Lesson with AI</DialogTitle>
          <DialogDescription>
            Describe your lesson topic and AI will build the full block structure for you
          </DialogDescription>
        </DialogHeader>

        {!proLoading && !isPro && <ProUpgradeBanner compact />}

        {/* Not configured warning */}
        {aiConfigured === false && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-4 space-y-2">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> AI is not configured
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Add <code className="bg-amber-100 dark:bg-amber-900/50 px-1 rounded">OPENAI_API_KEY</code> or{' '}
              <code className="bg-amber-100 dark:bg-amber-900/50 px-1 rounded">GOOGLE_GENERATIVE_AI_API_KEY</code> to{' '}
              <code className="bg-amber-100 dark:bg-amber-900/50 px-1 rounded">.env.local</code> and restart the dev server.
            </p>
            <div className="flex gap-2 pt-1">
              <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7 border-amber-400" asChild>
                <Link href="/setup" target="_blank"><ExternalLink className="w-3 h-3" />Setup guide</Link>
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7 border-amber-400" asChild>
                <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer">
                  <ExternalLink className="w-3 h-3" />Get OpenAI key
                </a>
              </Button>
            </div>
          </div>
        )}

        {/* Provider badge */}
        {aiConfigured === true && (
          <div className="flex items-center gap-1.5 text-xs text-green-700 dark:text-green-400">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            AI ready · {aiProvider} / {aiProvider === 'openai' ? 'gpt-4o-mini' : 'gemini-2.0-flash'}
          </div>
        )}

        <div className="space-y-4">
          {!loading ? (
            <>
              <div>
                <label className="text-sm font-medium">Topic *</label>
                <Input
                  placeholder="e.g., Photosynthesis, French Revolution, Quadratic Equations"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                  className="mt-1"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Grade Level</label>
                  <Input
                    placeholder="e.g., 9th Grade"
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Subject</label>
                  <Input
                    placeholder="e.g., Biology"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Duration (minutes)</label>
                <Input
                  type="number"
                  placeholder="45"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="mt-1"
                  min="15"
                  max="180"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={handleGenerate}
                  className="flex-1 gap-2"
                  disabled={!topic.trim() || aiConfigured === false || !isPro}
                >
                  <Sparkles className="w-4 h-4" />
                  Generate
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <Loader className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Generating your lesson plan…</p>
              </div>
              <p className="text-xs text-muted-foreground text-center">This may take 10–20 seconds…</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
