/**
 * Centralized AI provider configuration.
 *
 * Supports OpenAI (GPT-4o-mini) and Google Gemini (gemini-2.0-flash).
 * Set ONE of the following in .env.local:
 *   OPENAI_API_KEY=sk-...
 *   GOOGLE_GENERATIVE_AI_API_KEY=AIza...
 *
 * If both are set, OpenAI is preferred.
 * If neither is set all AI routes return a 503 with a setup message.
 */

import { openai as openaiProvider } from '@ai-sdk/openai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'

// Accept GEMINI_API_KEY (Google AI Studio default) OR GOOGLE_GENERATIVE_AI_API_KEY
function getGeminiApiKey(): string | undefined {
  return process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY
}

// v1beta is required for all preview / newer Gemini models (gemini-2.5-flash-preview, gemini-3-flash-preview, etc.)
function buildGoogleProvider() {
  return createGoogleGenerativeAI({
    apiKey: getGeminiApiKey(),
    baseURL: 'https://generativelanguage.googleapis.com/v1beta',
  })
}

export type AIProvider = 'openai' | 'google' | 'none'

export function getAIProvider(): AIProvider {
  if (process.env.OPENAI_API_KEY) return 'openai'
  if (getGeminiApiKey()) return 'google'
  return 'none'
}

export function isAIConfigured(): boolean {
  return getAIProvider() !== 'none'
}

/**
 * Returns the model to use for text generation / structured output.
 * Throws a structured error if no key is configured so routes can handle it cleanly.
 */
// Default to gemini-2.5-flash-preview — works for most Google AI Studio keys
// Override via GOOGLE_GEMINI_MODEL in .env.local
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash-preview-04-17'

export function getAIModel(_opts?: { fast?: boolean }) {
  const provider = getAIProvider()
  if (provider === 'openai') {
    return openaiProvider('gpt-4o-mini')
  }
  if (provider === 'google') {
    const modelName = process.env.GOOGLE_GEMINI_MODEL || DEFAULT_GEMINI_MODEL
    return buildGoogleProvider()(modelName)
  }
  throw new AINotConfiguredError()
}

export class AINotConfiguredError extends Error {
  readonly status = 503
  constructor() {
    super(
      'No AI provider is configured. Add OPENAI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY to your .env.local file and restart the dev server.',
    )
    this.name = 'AINotConfiguredError'
  }
}

/** Convert provider SDK errors to a standard { error, message } shape with the right HTTP status. */
export function handleAIError(error: unknown): Response {
  if (error instanceof AINotConfiguredError) return aiNotConfiguredResponse()

  const err = error as any
  const status = err?.statusCode ?? err?.status ?? 0
  const msg: string = err?.message ?? ''

  if (status === 429 || msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('rate limit')) {
    // Try to extract retry delay from Gemini error body
    let retryDelay: number | null = null
    try {
      const body = typeof err?.responseBody === 'string' ? JSON.parse(err.responseBody) : err?.data
      const bodyMsg: string = body?.error?.message || ''
      const m = bodyMsg.match(/retry in (\d+)/)
      if (m) retryDelay = parseInt(m[1])
    } catch { /* ignore */ }

    return Response.json({
      error: 'rate_limit',
      message: retryDelay
        ? `AI quota exceeded. Please try again in ${retryDelay} seconds.`
        : 'AI rate limit reached. Please wait a moment and try again, or upgrade your AI provider plan.',
      retry_after: retryDelay,
    }, { status: 429 })
  }

  if (status === 404 || msg.includes('is not found') || msg.includes('not supported for generateContent') || msg.includes('ListModels')) {
    return Response.json({
      error: 'model_not_found',
      message: 'Your Gemini API key does not have access to the requested model. Try setting GOOGLE_GEMINI_MODEL=gemini-pro in .env.local, or switch to OpenAI by adding OPENAI_API_KEY instead.',
    }, { status: 404 })
  }

  if (status === 401 || status === 403 || msg.toLowerCase().includes('api key') || msg.toLowerCase().includes('invalid key')) {
    return Response.json({
      error: 'invalid_key',
      message: 'Your AI API key is invalid or expired. Check your .env.local and restart the server.',
    }, { status: 401 })
  }

  console.error('[AI route error]', msg || error)
  return Response.json({ error: 'generation_failed', message: 'AI generation failed. Please try again.' }, { status: 500 })
}

/** Standard 503 response returned by all AI routes when no key is set. */
export function aiNotConfiguredResponse() {
  return Response.json(
    {
      error: 'ai_not_configured',
      message:
        'No AI provider is configured. Add OPENAI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY to .env.local and restart.',
      docs: 'https://platform.openai.com/api-keys',
    },
    { status: 503 },
  )
}

/** Returns config info safe to expose to the browser (no keys). */
export function getAIStatus() {
  const provider = getAIProvider()
  return {
    configured: provider !== 'none',
    provider,
    model:
      provider === 'openai'
        ? 'gpt-4o-mini'
        : provider === 'google'
          ? (process.env.GOOGLE_GEMINI_MODEL || DEFAULT_GEMINI_MODEL)
          : null,
    env_var: provider === 'google' ? (process.env.GOOGLE_GENERATIVE_AI_API_KEY ? 'GOOGLE_GENERATIVE_AI_API_KEY' : 'GEMINI_API_KEY') : undefined,
  }
}
