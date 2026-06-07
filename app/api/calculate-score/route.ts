import { generateObject } from 'ai'
import { z } from 'zod'
import { getAIModel, handleAIError } from '@/lib/ai-config'
import { requireProForAI } from '@/lib/require-pro-ai'

const ScoreSchema = z.object({
  reusability_score: z.number().describe('Reusability score from 0-100'),
  clarity_score: z.number().describe('Clarity score from 0-100'),
  engagement_score: z.number().describe('Engagement score from 0-100'),
  completeness_score: z.number().describe('Completeness score from 0-100'),
  overall_score: z.number().describe('Overall quality score from 0-100'),
  recommendations: z.array(z.string()).describe('List of improvements to increase score'),
})

export async function POST(request: Request) {
  try {
    const gate = await requireProForAI(request)
    if (gate instanceof Response) return gate

    const { blocks, title } = await request.json()

    if (!blocks || blocks.length === 0) {
      return new Response('Blocks are required', { status: 400 })
    }

    const blockContent = blocks
      .map((b: any) => `${b.type}: ${b.title} - ${b.content}`)
      .join('\n')

    const result = await generateObject({
      model: getAIModel({ fast: true }),
      schema: ScoreSchema,
      prompt: `Evaluate this lesson plan "${title}" on multiple dimensions:

${blockContent}

Score the lesson on:
1. Reusability: How easily can other teachers adapt this lesson?
2. Clarity: How well is the content explained?
3. Engagement: How engaging and interactive is the lesson?
4. Completeness: Does the lesson have all necessary components?
5. Overall: Overall quality score

Consider pedagogical best practices and provide specific recommendations for improvement.`,
    })

    return Response.json(result.object)
  } catch (error) {
    return handleAIError(error)
  }
}
