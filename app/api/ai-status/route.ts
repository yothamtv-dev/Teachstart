import { getAIStatus } from '@/lib/ai-config'
import { hasProAccess, getSubscriptionTier } from '@/lib/subscription'
import { requireProForAI } from '@/lib/require-pro-ai'

export async function GET(request: Request) {
  const status = getAIStatus()
  const gate = await requireProForAI(request)

  if (gate instanceof Response) {
    const unauthorized = gate.status === 401
    const proRequired = gate.status === 403

    return Response.json({
      ...status,
      access: {
        authenticated: !unauthorized,
        pro: false,
        tier: 'free' as const,
        requires_pro: true,
        blocked_reason: unauthorized ? 'sign_in_required' : proRequired ? 'pro_required' : 'unknown',
      },
    })
  }

  return Response.json({
    ...status,
    access: {
      authenticated: true,
      pro: hasProAccess(gate.profile),
      tier: getSubscriptionTier(gate.profile),
      requires_pro: true,
      blocked_reason: null,
    },
  })
}
