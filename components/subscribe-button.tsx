'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Crown, Loader2 } from 'lucide-react'
import { useSubscribe } from '@/hooks/use-subscribe'
import { FakePaymentDialog } from '@/components/fake-payment-dialog'
import { cn } from '@/lib/utils'

export function SubscribeButton({
  className,
  size = 'sm',
  variant = 'default',
  label = 'Subscribe to Pro',
  onSuccess,
}: {
  className?: string
  size?: 'sm' | 'default' | 'lg'
  variant?: 'default' | 'outline' | 'secondary'
  label?: string
  onSuccess?: () => void | Promise<void>
  showPromoInput?: boolean
}) {
  const [checkoutOpen, setCheckoutOpen] = useState(false)

  return (
    <>
      <Button
        type="button"
        size={size}
        variant={variant}
        className={cn('gap-1.5 w-full sm:w-auto', className)}
        onClick={() => setCheckoutOpen(true)}
      >
        <Crown className="w-4 h-4" />
        {label}
      </Button>
      <FakePaymentDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        onSuccess={onSuccess}
      />
    </>
  )
}

export function CancelProButton({
  className,
  size = 'sm',
  onSuccess,
}: {
  className?: string
  size?: 'sm' | 'default' | 'lg'
  onSuccess?: () => void | Promise<void>
}) {
  const { cancelPro, cancelLoading } = useSubscribe({ onSuccess })

  return (
    <Button
      type="button"
      size={size}
      variant="outline"
      className={cn('gap-1.5', className)}
      onClick={() => void cancelPro()}
      disabled={cancelLoading}
    >
      {cancelLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
      Cancel subscription
    </Button>
  )
}
