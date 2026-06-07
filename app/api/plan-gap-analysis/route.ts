import { generateObject } from 'ai'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase-config'
import { getAIModel, handleAIError } from '@/lib/ai-config'
import { requireProForAI } from '@/lib/require-pro-ai'

const GapSchema = z.object({
  summary: z.string().describe('2–3 sentence executive summary for the teacher'),
  missing_topics: z.array(z.string()).describe('Syllabus strands or topics that appear under-represented'),
  pacing_risks: z.array(z.string()).describe('Where timing or cognitive load may be unrealistic'),
  assessment_gaps: z.array(z.string()).describe('Formative/summative assessment coverage issues'),
  proactive_alerts: z
    .array(
      z.object({
        severity: z.enum(['info', 'warning', 'critical']),
        message: z.string(),
        suggestion: z.string(),
      }),
    )
    .describe('Actionable alerts before high-stakes testing windows'),
  suggested_next_lessons: z.array(z.string()).describe('Concrete lesson ideas to close gaps'),
})

function getDB() {
  const url = getSupabaseUrl()
  const key = getSupabaseAnonKey()
  if (!url || !key) return null
  return createClient(url, key)
}

export async function POST(request: Request) {
  try {
    const gate = await requireProForAI(request)
    if (gate instanceof Response) return gate

    const body = await request.json().catch(() => ({}))
    const { user_id, limit: rawLimit } = body
    const limit = Math.min(Number(rawLimit) || 12, 30)

    const db = getDB()
    let lessons: any[] = []
    let blocksByLesson = new Map<string, { block_type: string; title: string | null; position: number }[]>()
    let standards: any[] = []

    if (db && user_id) {
      const { data: lessonRows } = await db
        .from('lessons')
        .select('id, title, subject, grade_level, learning_objectives, updated_at')
        .eq('user_id', user_id)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false })
        .limit(limit)

      lessons = lessonRows || []
      const lessonIds = lessons.map((l) => l.id)

      if (lessonIds.length > 0) {
        const { data: blockRows } = await db
          .from('lesson_blocks')
          .select('lesson_id, block_type, title, position')
          .in('lesson_id', lessonIds)
          .order('position', { ascending: true })

        for (const row of blockRows || []) {
          const list = blocksByLesson.get(row.lesson_id) ?? []
          list.push(row)
          blocksByLesson.set(row.lesson_id, list)
        }
      }

      const { data: stdRows } = await db
        .from('curriculum_standards')
        .select('standard_code, standard_title, subject, grade_level')
        .limit(40)
      standards = stdRows || []
    }

    const planDigest = lessons
      .map((l: any) => {
        const blocks = (blocksByLesson.get(l.id) || [])
          .map((b) => `${b.block_type}: ${b.title}`)
          .join(' → ')
        const objs = (l.learning_objectives || []).join('; ')
        return `• ${l.title} [${l.subject} / ${l.grade_level}] — blocks: ${blocks || 'none'} — objectives: ${objs || 'none'}`
      })
      .join('\n')

    const standardsDigest =
      standards.map((s) => `${s.standard_code} (${s.subject}, ${s.grade_level})`).join('\n') || ''

    const { object } = await generateObject({
      model: getAIModel({ fast: true }),
      schema: GapSchema,
      prompt: `You analyze a teacher's recent lesson plan set holistically (as if for weekly / monthly planning).

Recent lessons (most recent first):
${planDigest || 'No lessons found in database.'}

Reference standards (subset):
${standardsDigest || 'No standards provided.'}

Identify cross-lesson gaps, redundancy, and testing readiness risks. Be constructive and specific.`,
      temperature: 0.35,
    })

    return Response.json({ ...object, lessons_analyzed: lessons.length })
  } catch (e) {
    return handleAIError(e)
  }
}
