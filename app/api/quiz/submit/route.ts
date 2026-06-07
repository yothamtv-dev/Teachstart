import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase-config'

function getAdminClient() {
  const url = getSupabaseUrl()
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || getSupabaseAnonKey()
  if (!url || !key) return null
  return createClient(url, key)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { student_id, lesson_id, answers } = body as {
      student_id: string
      lesson_id: string
      answers: Record<string, string> // questionIndex -> chosen answer
    }

    if (!student_id || !lesson_id || !answers) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const db = getAdminClient()
    if (!db) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 503 })
    }

    // Fetch all blocks for the lesson that have generated_questions
    const { data: blocks, error: blocksErr } = await db
      .from('lesson_blocks')
      .select('id, metadata')
      .eq('lesson_id', lesson_id)

    if (blocksErr) throw blocksErr

    // Build the answer key from all blocks' generated_questions
    type Question = {
      question_text?: string
      question?: string
      options?: string[]
      correct_answer?: string
      explanation?: string
    }

    const allQuestions: Question[] = []
    for (const block of blocks || []) {
      const qs = (block.metadata as any)?.generated_questions
      if (Array.isArray(qs)) {
        allQuestions.push(...qs)
      }
    }

    if (allQuestions.length === 0) {
      return NextResponse.json({ error: 'No questions found for this lesson' }, { status: 404 })
    }

    // Grade
    let score = 0
    const feedback: Record<string, { correct: boolean; correct_answer: string; explanation: string }> = {}

    allQuestions.forEach((q, idx) => {
      const key = String(idx)
      const submitted = (answers[key] || '').trim().toLowerCase()
      const correct = (q.correct_answer || '').trim().toLowerCase()
      const isCorrect = submitted === correct || submitted === correct.replace(/^[a-d]\.\s*/i, '')
      if (isCorrect) score++
      feedback[key] = {
        correct: isCorrect,
        correct_answer: q.correct_answer || '',
        explanation: q.explanation || '',
      }
    })

    const total = allQuestions.length
    const score_pct = total > 0 ? Math.round((score / total) * 100) : 0

    // Persist quiz attempt
    const { error: insertErr } = await db.from('quiz_attempts').insert({
      user_id: student_id,
      lesson_id,
      answers,
      score,
      total,
      feedback,
    })
    if (insertErr) console.error('[quiz/submit] insert error:', insertErr)

    // Also upsert student_engagement
    await db.from('student_engagement').upsert(
      {
        lesson_id,
        student_id,
        teacher_id: student_id, // placeholder; real teacher_id resolved from lesson on client if needed
        status: 'completed',
        completion_percentage: 100,
        quiz_score: score_pct,
        completed_at: new Date().toISOString(),
      },
      { onConflict: 'lesson_id,student_id' },
    )

    return NextResponse.json({
      score,
      total,
      score_pct,
      feedback,
    })
  } catch (err: any) {
    console.error('[quiz/submit] error:', err)
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 })
  }
}
