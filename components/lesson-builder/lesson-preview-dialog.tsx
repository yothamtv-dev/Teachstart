'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Eye } from 'lucide-react'
import { SmartVideoEmbed } from '@/components/learn/smart-video-embed'
import { LessonRichContent } from '@/components/learn/lesson-rich-content'

export function LessonPreviewDialog({
  title,
  subject,
  gradeLevel,
  blocks,
}: {
  title: string
  subject: string
  gradeLevel: string
  blocks: any[]
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-2" disabled={blocks.length === 0}>
          <Eye className="w-4 h-4" />
          Preview
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="pr-8">{title || 'Untitled lesson'}</DialogTitle>
          <DialogDescription className="flex flex-wrap gap-2">
            <Badge variant="secondary">{subject}</Badge>
            <Badge variant="outline">{gradeLevel}</Badge>
            <span className="text-xs text-muted-foreground w-full mt-1">
              Student-facing preview — timings hidden in delivery mode.
            </span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 pt-2">
          {blocks.map((b, i) => (
            <section key={b.id || i} className="rounded-lg border bg-muted/30 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
                {b.type || 'block'}
              </p>
              <h3 className="font-semibold text-base mb-2">{b.title}</h3>
              {b.metadata?.video_url && (
                <div className="mb-3">
                  <SmartVideoEmbed url={b.metadata.video_url} title={b.title || 'Video'} />
                </div>
              )}
              {b.content?.trim() ? (
                <LessonRichContent
                  content={b.content}
                  skipVideoUrls={b.metadata?.video_url ? [String(b.metadata.video_url)] : []}
                />
              ) : (
                !b.metadata?.video_url && (
                  <p className="text-sm italic text-muted-foreground">No content yet.</p>
                )
              )}
              {Array.isArray(b.metadata?.generated_questions) && b.metadata.generated_questions.length > 0 && (
                <div className="mt-3 text-sm border-t pt-3">
                  <p className="font-medium text-xs mb-2">Check your understanding</p>
                  <ol className="list-decimal pl-4 space-y-2">
                    {b.metadata.generated_questions.slice(0, 3).map((q: any, qi: number) => (
                      <li key={qi}>{q.question_text || q.question}</li>
                    ))}
                  </ol>
                </div>
              )}
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
