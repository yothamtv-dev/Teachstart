'use client'

import { useAuth } from '@/hooks/use-auth'
import { getSubscriptionTier, hasProAccess } from '@/lib/subscription'

export function useProAccess() {
  const { profile, user, loading } = useAuth()
  const tier = getSubscriptionTier(profile)
  const isPro = hasProAccess(profile)

  return {
    loading,
    isAuthenticated: !!user,
    isPro,
    tier,
    profile,
  }
}
