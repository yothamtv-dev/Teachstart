'use client'

import { Crown } from 'lucide-react'
import { PRO_REQUIRED_MESSAGE } from '@/lib/subscription'
import { SubscribeButton } from '@/components/subscribe-button'
import { cn } from '@/lib/utils'

export function ProUpgradeBanner({
  className,
  compact = false,
}: {
  className?: string
  compact?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-lg border border-violet-300 bg-violet-50 dark:bg-violet-950/30 dark:border-violet-800 p-4',
        className,
      )}
    >
      <p className={cn('font-semibold text-violet-900 dark:text-violet-100 flex items-center gap-2', compact ? 'text-sm' : 'text-base')}>
        <Crown className="w-4 h-4 shrink-0" />
        Pro feature
      </p>
      <p className={cn('text-violet-800 dark:text-violet-200 mt-1', compact ? 'text-xs' : 'text-sm')}>
        {PRO_REQUIRED_MESSAGE}
      </p>
      <div className={cn('mt-3', compact && 'mt-2')}>
        <SubscribeButton size="sm" label={compact ? 'Upgrade to Pro' : 'Subscribe to Pro'} />
      </div>
    </div>
  )
}
