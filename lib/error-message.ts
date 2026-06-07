/**
 * Normalizes unknown thrown values (e.g. PostgrestError, plain objects) for logging and UI.
 */
export function getErrorMessage(error: unknown): string {
  if (error == null) return 'Unknown error'
  if (typeof error === 'string') return error
  if (typeof error === 'object') {
    const o = error as Record<string, unknown> & {
      message?: unknown
      name?: unknown
      code?: unknown
      details?: unknown
      hint?: unknown
    }
    const msg = typeof o.message === 'string' ? o.message : ''
    const code = typeof o.code === 'string' ? o.code : ''
    const details = typeof o.details === 'string' ? o.details : ''
    const hint = typeof o.hint === 'string' ? o.hint : ''
    const parts = [msg, code && `[${code}]`, details, hint].filter(Boolean)
    const joined = parts.join(' — ').trim()
    if (joined) return joined
    if (error instanceof Error && error.name && error.name !== 'Error') {
      return error.name
    }
    try {
      const s = JSON.stringify(error)
      if (s && s !== '{}') return s
    } catch {
      /* ignore */
    }
  }
  if (error instanceof Error) return error.message || error.name || 'Unknown error'
  return String(error)
}
