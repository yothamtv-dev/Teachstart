import { generateObject } from 'ai'
import { z } from 'zod'
import { getAIModel, handleAIError } from '@/lib/ai-config'
import { requireProForAI } from '@/lib/require-pro-ai'

const QuestionsSchema = z.object({
  questions: z.array(
    z.object({
      question_text: z.string(),
      question_type: z.enum(['multiple_choice', 'short_answer', 'true_false']),
      options: z.array(z.string()).optional(),
      correct_answer: z.string(),
      explanation: z.string(),
      bloom_level: z.string().optional(),
    }),
  ),
})

export async function POST(request: Request) {
  try {
    const gate = await requireProForAI(request)
    if (gate instanceof Response) return gate

    const { content, questionCount = 5, questionType = 'multiple_choice' } = await request.json()

    if (!content || typeof content !== 'string') {
      return new Response('Content is required', { status: 400 })
    }

    const count = Math.min(Math.max(Number(questionCount) || 5, 1), 12)

    const typeHint =
      questionType === 'short_answer'
        ? 'Use question_type "short_answer" for all; set correct_answer to the expected answer text.'
        : questionType === 'true_false'
          ? 'Use question_type "true_false"; options should be ["True","False"]; correct_answer is "True" or "False".'
          : 'Use question_type "multiple_choice"; provide exactly 4 options; correct_answer must exactly match one of the options.'

    const { object } = await generateObject({
      model: getAIModel({ fast: true }),
      schema: QuestionsSchema,
      prompt: `Create exactly ${count} assessment items from the lesson content below.

Rules:
- ${typeHint}
- Increase difficulty slightly across the set.
- Align bloom_level where natural (remember/understand/apply/analyze/evaluate/create).
- Explanations should teach why the answer is correct.

Content:
${content.slice(0, 12000)}`,
      temperature: 0.55,
    })

    return Response.json(object)
  } catch (error) {
    return handleAIError(error)
  }
}
