import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import { isAdminEmail } from '@/lib/admin-emails'

/** Fields written to public.users (must match RLS insert policy: auth.uid() = id). */
export function buildUserProfilePayload(authUser: SupabaseUser) {
  const meta = authUser.user_metadata || {}
  const email = authUser.email ?? ''

  if (isAdminEmail(email)) {
    return {
      id: authUser.id,
      email,
      full_name: typeof meta.full_name === 'string' ? meta.full_name : null,
      school_name: typeof meta.school_name === 'string' ? meta.school_name : null,
      role: 'admin' as const,
    }
  }

  const roleRaw = meta.role
  const role =
    roleRaw === 'student' || roleRaw === 'admin' || roleRaw === 'teacher' ? roleRaw : 'teacher'
  return {
    id: authUser.id,
    email,
    full_name: typeof meta.full_name === 'string' ? meta.full_name : null,
    school_name: typeof meta.school_name === 'string' ? meta.school_name : null,
    role,
  }
}

/**
 * Ensures a row exists in public.users for this auth user (required for lessons.user_id FK).
 */
export async function ensurePublicUserProfile(
  supabase: SupabaseClient,
  authUser: SupabaseUser,
): Promise<{ error: { message: string; code?: string } | null }> {
  const { error } = await supabase
    .from('users')
    .upsert(buildUserProfilePayload(authUser), { onConflict: 'id' })

  if (error) return { error: { message: error.message, code: error.code } }
  return { error: null }
}

/** Upsert + return row (for auth bootstrap). */
export async function upsertPublicUserProfileRow(
  supabase: SupabaseClient,
  authUser: SupabaseUser,
) {
  return supabase
    .from('users')
    .upsert(buildUserProfilePayload(authUser), { onConflict: 'id' })
    .select('*')
    .single()
}
