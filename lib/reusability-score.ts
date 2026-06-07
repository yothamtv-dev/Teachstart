/**
 * Calculates a Reusability Score (0–100) for a lesson based on:
 * - Block variety (types covered)
 * - Presence of learning objectives
 * - Video content
 * - Quiz / practice questions
 * - Resources / links
 * - Content completeness (blocks with content text)
 * - Description / subtitle
 * - Appropriate length (not too short, not too long)
 */

type Block = {
  type: string
  content?: string
  metadata?: Record<string, unknown>
  duration?: number
}

export type ReusabilityBreakdown = {
  score: number // 0–100
  label: 'Poor' | 'Fair' | 'Good' | 'Excellent'
  color: 'destructive' | 'warning' | 'success'
  details: { criterion: string; earned: number; max: number; met: boolean }[]
}

const BLOCK_VARIETY_GOOD = new Set([
  'introduction',
  'content',
  'video',
  'activity',
  'discussion',
  'assessment',
  'reflection',
])

export function computeReusabilityScore(opts: {
  title: string
  description: string
  subject: string
  gradeLevel: string
  learningObjectives: string[]
  blocks: Block[]
}): ReusabilityBreakdown {
  const { description, learningObjectives, blocks } = opts
  const details: ReusabilityBreakdown['details'] = []

  // 1. Learning objectives present (15 pts)
  const hasObjectives = learningObjectives.filter(Boolean).length >= 2
  details.push({ criterion: 'Has ≥2 learning objectives', earned: hasObjectives ? 15 : 0, max: 15, met: hasObjectives })

  // 2. Description / subtitle (10 pts)
  const hasDesc = description.trim().length >= 20
  details.push({ criterion: 'Has a lesson description', earned: hasDesc ? 10 : 0, max: 10, met: hasDesc })

  // 3. Block variety (15 pts)
  const usedTypes = new Set(blocks.map((b) => b.type))
  const varietyCount = [...usedTypes].filter((t) => BLOCK_VARIETY_GOOD.has(t)).length
  const varietyPts = Math.min(15, varietyCount * 5)
  details.push({
    criterion: `Uses ≥3 diverse block types (found ${varietyCount})`,
    earned: varietyPts,
    max: 15,
    met: varietyCount >= 3,
  })

  // 4. Has video (15 pts)
  const hasVideo = blocks.some(
    (b) =>
      b.type === 'video' ||
      (typeof (b.metadata as any)?.video_url === 'string' && (b.metadata as any).video_url),
  )
  details.push({ criterion: 'Includes a video', earned: hasVideo ? 15 : 0, max: 15, met: hasVideo })

  // 5. Has quiz questions (15 pts)
  const hasQuiz = blocks.some(
    (b) =>
      Array.isArray((b.metadata as any)?.generated_questions) &&
      (b.metadata as any).generated_questions.length > 0,
  )
  details.push({ criterion: 'Has practice/quiz questions', earned: hasQuiz ? 15 : 0, max: 15, met: hasQuiz })

  // 6. Has resource links (10 pts)
  const hasResources = blocks.some(
    (b) =>
      Array.isArray((b.metadata as any)?.attachments) && (b.metadata as any).attachments.length > 0,
  )
  details.push({ criterion: 'Includes resources / links', earned: hasResources ? 10 : 0, max: 10, met: hasResources })

  // 7. Content completeness – at least 60% of blocks have text content (10 pts)
  const withContent = blocks.filter((b) => b.content && b.content.trim().length > 20).length
  const completenessRatio = blocks.length > 0 ? withContent / blocks.length : 0
  const contentPts = completenessRatio >= 0.6 ? 10 : completenessRatio >= 0.3 ? 5 : 0
  details.push({
    criterion: '≥60% of blocks have text content',
    earned: contentPts,
    max: 10,
    met: completenessRatio >= 0.6,
  })

  // 8. Appropriate lesson length (5–8 blocks) (10 pts)
  const goodLength = blocks.length >= 3 && blocks.length <= 12
  details.push({
    criterion: `Lesson has 3–12 blocks (found ${blocks.length})`,
    earned: goodLength ? 10 : 0,
    max: 10,
    met: goodLength,
  })

  const total = details.reduce((s, d) => s + d.max, 0) // should be 100
  const score = Math.round(details.reduce((s, d) => s + d.earned, 0) / total * 100)

  const label: ReusabilityBreakdown['label'] =
    score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Poor'
  const color: ReusabilityBreakdown['color'] =
    score >= 80 ? 'success' : score >= 60 ? 'warning' : 'destructive'

  return { score, label, color, details }
}
