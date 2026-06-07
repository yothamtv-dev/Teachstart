/** Extract embeddable URL for common providers. */
export function getVideoEmbedSrc(url: string): string | null {
  if (!url?.trim()) return null
  const u = url.trim()

  const shorts = u.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/)
  if (shorts) {
    return `https://www.youtube.com/embed/${shorts[1]}?rel=0`
  }

  const yt =
    u.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/) ||
    u.match(/^([a-zA-Z0-9_-]{11})$/)
  if (yt) {
    const id = yt[1]
    return `https://www.youtube.com/embed/${id}?rel=0`
  }

  const vimeo = u.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (vimeo) {
    return `https://player.vimeo.com/video/${vimeo[1]}`
  }

  const loom = u.match(/loom\.com\/share\/([a-zA-Z0-9-]+)/)
  if (loom) {
    return `https://www.loom.com/embed/${loom[1]}`
  }

  return null
}

export function isDirectVideoUrl(url: string): boolean {
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url.trim())
}

/** True if SmartVideoEmbed will render an iframe or <video> (not just an external link). */
export function isPlayableVideoUrl(url: string): boolean {
  if (!url?.trim()) return false
  return Boolean(getVideoEmbedSrc(url) || isDirectVideoUrl(url))
}

function normalizeVideoRef(url: string): string {
  return url.trim().replace(/[)\].,;]+$/, '')
}

export type ContentVideoSegment = { type: 'text'; value: string } | { type: 'video'; value: string }

/**
 * Split block body text into text + inline video segments when a line is only a supported video URL.
 * Skips URLs listed in skipUrls (e.g. already shown from metadata.video_url).
 */
export function parseContentVideoSegments(content: string, skipUrls: string[] = []): ContentVideoSegment[] {
  if (!content) return []
  const skip = new Set(skipUrls.map((s) => normalizeVideoRef(s)).filter(Boolean))
  const lines = content.split('\n')
  const out: ContentVideoSegment[] = []
  let textBuf: string[] = []

  const flushText = () => {
    if (textBuf.length) {
      const value = textBuf.join('\n')
      if (value.trim()) out.push({ type: 'text', value })
      textBuf = []
    }
  }

  for (const line of lines) {
    const trimmed = line.trim()
    const candidate = normalizeVideoRef(trimmed)
    const isLineOnlyUrl = /^https?:\/\/\S+$/i.test(candidate)
    const playable = isPlayableVideoUrl(candidate)
    const shouldSkip = skip.has(candidate)

    if (isLineOnlyUrl && playable && !shouldSkip) {
      flushText()
      out.push({ type: 'video', value: candidate })
      continue
    }
    textBuf.push(line)
  }
  flushText()
  return out
}
