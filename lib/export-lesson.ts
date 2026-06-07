export function lessonToMarkdown(
  title: string,
  subject: string,
  gradeLevel: string,
  blocks: Array<{ type?: string; title?: string; content?: string; duration?: number; metadata?: any }>,
): string {
  const lines: string[] = [
    `# ${title}`,
    '',
    `**Subject:** ${subject} · **Grade:** ${gradeLevel}`,
    '',
    '---',
    '',
  ]

  blocks.forEach((b, i) => {
    const dur = b.duration != null ? ` (${b.duration} min)` : ''
    lines.push(`## ${i + 1}. ${b.title || 'Block'} — *${b.type || 'block'}*${dur}`, '')
    if (b.content) lines.push(b.content, '')
    const qs = b.metadata?.generated_questions as any[] | undefined
    if (qs?.length) {
      lines.push('### Generated questions', '')
      qs.forEach((q, qi) => {
        lines.push(`${qi + 1}. ${q.question_text || q.question}`)
        if (q.options?.length) {
          q.options.forEach((opt: string, oi: number) => lines.push(`   ${String.fromCharCode(65 + oi)}. ${opt}`))
        }
        if (q.explanation) lines.push(`   *${q.explanation}*`)
        lines.push('')
      })
    }
    const vid = b.metadata?.video_url as string | undefined
    if (vid) lines.push(`**Video:** ${vid}`, '')
    lines.push('')
  })

  return lines.join('\n')
}

export function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
