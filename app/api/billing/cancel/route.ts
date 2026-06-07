import { getAuthUserFromRequest } from '@/lib/auth-request'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: Request) {
  const auth = await getAuthUserFromRequest(request)
  if (!auth) {
    return Response.json({ error: 'unauthorized', message: 'Sign in required.' }, { status: 401 })
  }

  const { data: profile } = await auth.supabase
    .from('users')
    .select('role')
    .eq('id', auth.user.id)
    .maybeSingle()

  if (profile?.role === 'admin') {
    return Response.json({ error: 'admin_protected', message: 'Admin accounts cannot downgrade here.' }, { status: 400 })
  }

  const db = getSupabaseAdmin() ?? auth.supabase
  const { data: saved, error } = await db
    .from('users')
    .update({
      subscription_tier: 'free',
      subscription_status: 'canceled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', auth.user.id)
    .select('id')
    .maybeSingle()

  if (error) {
    return Response.json({ error: 'cancel_failed', message: error.message }, { status: 500 })
  }

  if (!saved) {
    return Response.json(
      { error: 'cancel_failed', message: 'Could not update plan. Run scripts/patches/009-subscribe-rls-fix.sql in Supabase.' },
      { status: 500 },
    )
  }

  return Response.json({ success: true, tier: 'free' })
}
