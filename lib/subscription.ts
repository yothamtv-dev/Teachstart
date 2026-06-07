export type SubscriptionTier = 'free' | 'pro'

export type UserPlanProfile = {
  role?: string | null
  subscription_tier?: SubscriptionTier | string | null
  subscription_status?: string | null
  stripe_customer_id?: string | null
}

export function getSubscriptionTier(profile: UserPlanProfile | null | undefined): SubscriptionTier {
  return profile?.subscription_tier === 'pro' ? 'pro' : 'free'
}

export function hasProAccess(profile: UserPlanProfile | null | undefined): boolean {
  if (!profile) return false
  if (profile.role === 'admin') return true
  if (getSubscriptionTier(profile) !== 'pro') return false
  if (!profile.subscription_status) return true
  return (
    profile.subscription_status === 'active' ||
    profile.subscription_status === 'trialing' ||
    profile.subscription_status === 'past_due'
  )
}

export const PRO_REQUIRED_MESSAGE =
  'AI features are available on the Pro plan. Upgrade to unlock lesson generation, quizzes, and curriculum intelligence.'
