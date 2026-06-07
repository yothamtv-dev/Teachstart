import { generateObject } from 'ai'
import { z } from 'zod'
import { getAIModel, handleAIError } from '@/lib/ai-config'
import { requireProForAI } from '@/lib/require-pro-ai'

const TimeEstimateSchema = z.object({
  reading_time: z.number().describe('Estimated reading time in minutes'),
  activity_time: z.number().describe('Estimated time for activities in minutes'),
  discussion_time: z.number().describe('Estimated discussion time in minutes'),
  assessment_time: z.number().describe('Estimated assessment time in minutes'),
  total_time: z.number().describe('Total estimated lesson time in minutes'),
  justification: z.string().describe('Brief explanation of the estimate'),
})

export async function POST(request: Request) {
  try {
    const gate = await requireProForAI(request)
    if (gate instanceof Response) return gate

    const { blocks, gradeLevel } = await request.json()

    if (!blocks || blocks.length === 0) {
      return new Response('Blocks are required', { status: 400 })
    }

    const blockContent = blocks
      .map((b: any) => `${b.type}: ${b.title} - ${b.content}`)
      .join('\n')

    const result = await generateObject({
      model: getAIModel({ fast: true }),
      schema: TimeEstimateSchema,
      prompt: `Estimate the time needed for this lesson for ${gradeLevel || 'middle school'} students:

${blockContent}

Consider:
- Content complexity and depth
- Time for students to understand
- Activities and hands-on work
- Discussion and interaction
- Assessment and feedback

Provide realistic time estimates for each component.`,
    })

    return Response.json(result.object)
  } catch (error) {
    return handleAIError(error)
  }
}
