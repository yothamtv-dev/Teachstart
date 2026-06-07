'use client'

import { getVideoEmbedSrc, isDirectVideoUrl } from '@/lib/video-embed'

export function SmartVideoEmbed({ url, title }: { url: string; title?: string }) {
  const embed = getVideoEmbedSrc(url)
  if (embed) {
    return (
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black shadow-xl border">
        <iframe
          src={embed}
          title={title || 'Lesson video'}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    )
  }
  if (isDirectVideoUrl(url)) {
    return (
      <div className="rounded-xl overflow-hidden border bg-black shadow-xl">
        <video src={url} controls className="w-full max-h-[480px]" title={title}>
          <track kind="captions" />
        </video>
      </div>
    )
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="block p-6 rounded-xl border bg-muted/50 text-primary font-medium hover:underline"
    >
      Open media link → {url}
    </a>
  )
}
