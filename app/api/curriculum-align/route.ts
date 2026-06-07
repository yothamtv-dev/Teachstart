import { generateObject } from 'ai'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase-config'
import { getAIModel, handleAIError } from '@/lib/ai-config'
import { requireProForAI } from '@/lib/require-pro-ai'
import { lessonBlocksToPlainText, extractLearningObjectives } from '@/lib/lesson-helpers'

const AlignmentSchema = z.object({
  coverage_score: z
    .number()
    .min(0)
    .max(100)
    .describe('Estimated percent of relevant standards addressed by this lesson'),
  aligned_standards: z.array(
    z.object({
      standard_code: z.string(),
      alignment_strength: z.enum(['strong', 'partial', 'weak']),
      rationale: z.string(),
    }),
  ),
  gaps: z
    .array(z.string())
    .describe('Important standards or skills that seem missing or under-addressed'),
  mandatory_flags: z
    .array(
      z.object({
        requirement: z.string(),
        status: z.enum(['met', 'partial', 'missing']),
        note: z.string(),
      }),
    )
    .describe('Checklist-style validation for stated objectives vs activities'),
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

    const { title, blocks, subject, gradeLevel, lessonId } = await request.json()

    if (!blocks?.length) {
      return new Response('Blocks are required', { status: 400 })
    }

    const db = getDB()
    let standards: any[] = []

    if (db) {
      const { data } = await db
        .from('curriculum_standards')
        .select('id, standard_code, standard_title, standard_description, subject, grade_level, grade_band')
        .limit(80)
      standards = data || []
    }

    const standardsList = standards.map(
      (s) =>
        `${s.standard_code}: ${s.standard_title} (${s.subject}, grade ${s.grade_level}) — ${s.standard_description || ''}`,
    )

    const lessonText = lessonBlocksToPlainText(blocks)
    const objectives = extractLearningObjectives(blocks)

    const { object } = await generateObject({
      model: getAIModel({ fast: true }),
      schema: AlignmentSchema,
      prompt: `You are a curriculum alignment specialist. Compare the lesson to the standards list and estimate alignment.

Lesson title: ${title || 'Untitled'}
Subject hint: ${subject || 'unspecified'}
Grade hint: ${gradeLevel || 'unspecified'}
Learning objectives from lesson: ${objectives.length ? objectives.join('; ') : 'none stated explicitly'}

Lesson body:
${lessonText}

Official standards database (codes you may reference; only use codes that appear below):
${standardsList.length ? standardsList.join('\n') : 'No standards loaded — infer general gaps only.'}

Rules:
- aligned_standards should cite standard_code values exactly from the list when possible.
- If the list is empty, still return gaps and mandatory_flags using professional judgment.
- mandatory_flags: treat "must-have" lesson parts (objectives, formative assessment, differentiation signal) as requirements.`,
      temperature: 0.3,
    })

    // Optionally persist standards links
    if (lessonId && db && standards.length) {
      const codeToId = new Map(standards.map((s) => [s.standard_code, s.id]))
      const rows = object.aligned_standards
        .filter((a) => a.alignment_strength !== 'weak')
        .map((a) => {
          const sid = codeToId.get(a.standard_code)
          if (!sid) return null
          return { lesson_id: lessonId, standard_id: sid }
        })
        .filter(Boolean) as { lesson_id: string; standard_id: string }[]

      if (rows.length) {
        await db.from('lesson_standards').delete().eq('lesson_id', lessonId)
        await db.from('lesson_standards').insert(rows)
      }
    }

    return Response.json(object)
  } catch (e) {
    return handleAIError(e)
  }
}
