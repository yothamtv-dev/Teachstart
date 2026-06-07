import { getAuthUserFromRequest } from '@/lib/auth-request'
import { buildUserProfilePayload } from '@/lib/ensure-user-profile'
import { hasProAccess } from '@/lib/subscription'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

function schemaMissingMessage() {
  return 'Pro subscription is not set up in the database yet. Open Supabase → SQL Editor, run scripts/patches/006-subscription-tier.sql and 009-subscribe-rls-fix.sql, then try again.'
}

export async function POST(request: Request) {
  const auth = await getAuthUserFromRequest(request)
  if (!auth) {
    return Response.json({ error: 'unauthorized', message: 'Sign in to subscribe.' }, { status: 401 })
  }

  const requiredCode = process.env.SUBSCRIBE_PROMO_CODE?.trim()
  if (requiredCode) {
    const body = await request.json().catch(() => ({}))
    const promoCode = typeof body.promoCode === 'string' ? body.promoCode.trim() : ''
    if (promoCode !== requiredCode) {
      return Response.json(
        { error: 'invalid_code', message: 'Invalid subscription code. Contact your school administrator.' },
        { status: 403 },
      )
    }
  }

  const { data: profile, error: profileError } = await auth.supabase
    .from('users')
    .select('role, subscription_tier, subscription_status')
    .eq('id', auth.user.id)
    .maybeSingle()

  if (profileError) {
    const hint =
      profileError.code === '42703' || profileError.message?.includes('subscription_tier')
        ? schemaMissingMessage()
        : profileError.message
    return Response.json({ error: 'profile_lookup_failed', message: hint }, { status: 503 })
  }

  if (hasProAccess(profile)) {
    return Response.json({ error: 'already_pro', message: 'You already have Pro access.' }, { status: 400 })
  }

  const admin = getSupabaseAdmin()
  const db = admin ?? auth.supabase

  const { data: saved, error } = await db
    .from('users')
    .upsert(
      {
        ...buildUserProfilePayload(auth.user),
        subscription_tier: 'pro',
        subscription_status: 'active',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    )
    .select('id, subscription_tier')
    .maybeSingle()

  if (error) {
    console.error('[subscribe] upsert failed:', error.message, error.code)
    const hint =
      error.code === '42703' || error.message?.includes('subscription_tier')
        ? schemaMissingMessage()
        : error.message || 'Could not activate Pro.'
    return Response.json({ error: 'subscribe_failed', message: hint }, { status: 500 })
  }

  if (!saved) {
    return Response.json(
      {
        error: 'subscribe_failed',
        message: admin
          ? 'Could not save Pro status. Confirm scripts/patches/006 and 009 are applied in Supabase.'
          : 'Update was blocked by database permissions. Run scripts/patches/009-subscribe-rls-fix.sql in Supabase, or add SUPABASE_SERVICE_ROLE_KEY to your server env.',
      },
      { status: 500 },
    )
  }

  return Response.json({ success: true, tier: 'pro' })
}
