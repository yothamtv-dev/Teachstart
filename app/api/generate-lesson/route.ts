import { generateObject } from 'ai'
import { z } from 'zod'
import { getAIModel, aiNotConfiguredResponse, AINotConfiguredError } from '@/lib/ai-config'
import { requireProForAI } from '@/lib/require-pro-ai'

const BlockSchema = z.object({
  type: z.enum(['warmup', 'introduction', 'content', 'video', 'activity', 'discussion', 'reflection', 'assessment']),
  title: z.string(),
  content: z.string(),
  duration: z.number().int().min(1).max(60),
  learning_objectives: z.array(z.string()).optional(),
})

const LessonSchema = z.object({
  title: z.string(),
  description: z.string(),
  duration: z.number().int(),
  learning_objectives: z.array(z.string()),
  blocks: z.array(BlockSchema).min(3).max(10),
})

export async function POST(request: Request) {
  try {
    const gate = await requireProForAI(request)
    if (gate instanceof Response) return gate

    const { topic, gradeLevel, subject, duration } = await request.json()

    if (!topic) {
      return Response.json({ error: 'Topic is required' }, { status: 400 })
    }

    const { object } = await generateObject({
      model: getAIModel({ fast: true }),
      schema: LessonSchema,
      prompt: `Create a complete, engaging lesson plan for:

Topic: ${topic}
${gradeLevel ? `Grade Level: ${gradeLevel}` : ''}
${subject ? `Subject: ${subject}` : ''}
Target duration: ${duration || 45} minutes

Requirements:
- At least 5 blocks covering: warm-up, content delivery, interactive activity, discussion, and assessment
- Realistic durations that sum close to ${duration || 45} minutes
- Rich, detailed content for each block (3–5 sentences minimum)
- Clear, measurable learning objectives
- Age-appropriate language for ${gradeLevel || 'middle school'} students
- Make it engaging and pedagogically sound`,
      temperature: 0.7,
    })

    return Response.json(object)
  } catch (error: any) {
    if (error instanceof AINotConfiguredError) return aiNotConfiguredResponse()

    // Rate limit / quota
    const status = error?.statusCode ?? error?.status ?? 0
    if (status === 429 || error?.message?.includes('429') || error?.message?.includes('quota') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
      const retryDelay = error?.responseBody
        ? (() => {
            try {
              const body = JSON.parse(error.responseBody)
              const msg: string = body?.error?.message || ''
              const m = msg.match(/retry in (\d+)/)
              return m ? parseInt(m[1]) : null
            } catch { return null }
          })()
        : null

      return Response.json({
        error: 'rate_limit',
        message: retryDelay
          ? `AI quota exceeded. Please try again in ${retryDelay} seconds.`
          : 'AI rate limit reached. Please wait a moment and try again, or upgrade your AI provider plan.',
        retry_after: retryDelay,
      }, { status: 429 })
    }

    // Auth / key invalid
    if (status === 401 || status === 403 || error?.message?.includes('API key')) {
      return Response.json({
        error: 'invalid_key',
        message: 'Your AI API key is invalid or expired. Check your .env.local and restart the server.',
      }, { status: 401 })
    }

    console.error('[generate-lesson] error:', error?.message || error)
    return Response.json({ error: 'generation_failed', message: 'Lesson generation failed. Please try again.' }, { status: 500 })
  }
}
