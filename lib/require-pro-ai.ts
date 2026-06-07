import type { SupabaseClient, User } from '@supabase/supabase-js'
import { getAuthUserFromRequest } from '@/lib/auth-request'
import { hasProAccess, PRO_REQUIRED_MESSAGE, type UserPlanProfile } from '@/lib/subscription'

export type ProAIContext = {
  user: User
  profile: UserPlanProfile
  supabase: SupabaseClient
}

export function proRequiredResponse() {
  return Response.json(
    {
      error: 'pro_required',
      message: PRO_REQUIRED_MESSAGE,
    },
    { status: 403 },
  )
}

export function unauthorizedAIResponse() {
  return Response.json(
    {
      error: 'unauthorized',
      message: 'Sign in required to use AI features.',
    },
    { status: 401 },
  )
}

/** Returns context when the caller may use AI routes; otherwise a Response to return. */
export async function requireProForAI(request: Request): Promise<ProAIContext | Response> {
  const auth = await getAuthUserFromRequest(request)
  if (!auth) return unauthorizedAIResponse()

  const { data: profile, error } = await auth.supabase
    .from('users')
    .select('role, subscription_tier, subscription_status')
    .eq('id', auth.user.id)
    .maybeSingle()

  if (error) {
    console.error('[requireProForAI] profile lookup failed:', error.message)
    return Response.json({ error: 'profile_lookup_failed', message: 'Could not verify subscription.' }, { status: 500 })
  }

  if (!hasProAccess(profile)) return proRequiredResponse()

  return { user: auth.user, profile: profile ?? {}, supabase: auth.supabase }
}
