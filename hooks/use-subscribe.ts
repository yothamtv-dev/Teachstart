'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { authenticatedFetch } from '@/lib/authenticated-fetch'
import { useAuth } from '@/hooks/use-auth'

export function useSubscribe(options?: { onSuccess?: () => void | Promise<void> }) {
  const { refreshProfile } = useAuth()
  const [subscribeLoading, setSubscribeLoading] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)

  const subscribe = async (promoCode?: string) => {
    setSubscribeLoading(true)
    try {
      const res = await authenticatedFetch('/api/billing/subscribe', {
        method: 'POST',
        body: JSON.stringify({ promoCode: promoCode?.trim() || undefined }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.message || 'Could not activate Pro')
        return false
      }
      toast.success('Welcome to Pro! AI features are now unlocked.')
      await refreshProfile()
      await options?.onSuccess?.()
      return true
    } catch {
      toast.error('Could not activate Pro')
      return false
    } finally {
      setSubscribeLoading(false)
    }
  }

  const cancelPro = async () => {
    setCancelLoading(true)
    try {
      const res = await authenticatedFetch('/api/billing/cancel', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.message || 'Could not cancel Pro')
        return false
      }
      toast.success('Downgraded to Free plan')
      await refreshProfile()
      await options?.onSuccess?.()
      return true
    } catch {
      toast.error('Could not cancel Pro')
      return false
    } finally {
      setCancelLoading(false)
    }
  }

  return { subscribe, cancelPro, subscribeLoading, cancelLoading }
}
