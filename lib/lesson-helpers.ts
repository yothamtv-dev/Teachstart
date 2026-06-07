export function lessonBlocksToPlainText(
  blocks: Array<{ type?: string; title?: string; content?: string }>,
): string {
  return blocks
    .map((b) => `${b.type || 'block'}: ${b.title || ''}\n${b.content || ''}`)
    .join('\n\n')
}

export function extractLearningObjectives(blocks: any[]): string[] {
  const out: string[] = []
  for (const b of blocks) {
    const fromBlock = b.learning_objectives
    if (Array.isArray(fromBlock)) {
      for (const o of fromBlock) {
        if (typeof o === 'string' && o.trim()) out.push(o.trim())
      }
    }
    const meta = b.metadata?.learning_objectives
    if (Array.isArray(meta)) {
      for (const o of meta) {
        if (typeof o === 'string' && o.trim()) out.push(o.trim())
      }
    }
  }
  return [...new Set(out)]
}
