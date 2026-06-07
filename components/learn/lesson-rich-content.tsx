'use client'

import { useMemo } from 'react'
import { parseContentVideoSegments } from '@/lib/video-embed'
import { SmartVideoEmbed } from '@/components/learn/smart-video-embed'

export function LessonRichContent({
  content,
  skipVideoUrls = [],
}: {
  content: string
  skipVideoUrls?: string[]
}) {
  const segments = useMemo(
    () => parseContentVideoSegments(content, skipVideoUrls),
    [content, skipVideoUrls],
  )

  if (segments.length === 0) return null

  return (
    <div className="space-y-4 text-sm max-w-none leading-relaxed text-foreground/95">
      {segments.map((seg, i) =>
        seg.type === 'video' ? (
          <SmartVideoEmbed key={`v-${i}`} url={seg.value} title="Video" />
        ) : (
          <div key={`t-${i}`} className="whitespace-pre-wrap">
            {seg.value}
          </div>
        ),
      )}
    </div>
  )
}
