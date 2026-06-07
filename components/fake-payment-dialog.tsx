'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { CreditCard, Loader2, Lock, ShieldCheck } from 'lucide-react'
import { formatProPrice } from '@/lib/payment-config'
import { APP_NAME } from '@/lib/app-config'
import { useSubscribe } from '@/hooks/use-subscribe'
import { toast } from 'sonner'

const REQUIRES_CODE = !!process.env.NEXT_PUBLIC_SUBSCRIBE_REQUIRES_CODE

function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 16)
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim()
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

export function FakePaymentDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void | Promise<void>
}) {
  const [cardName, setCardName] = useState('')
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242')
  const [expiry, setExpiry] = useState('12/30')
  const [cvc, setCvc] = useState('123')
  const [promoCode, setPromoCode] = useState('')
  const [processing, setProcessing] = useState(false)
  const { subscribe } = useSubscribe({ onSuccess })

  const handlePay = async () => {
    const digits = cardNumber.replace(/\D/g, '')
    if (!cardName.trim()) {
      toast.error('Enter the name on card')
      return
    }
    if (digits.length < 13) {
      toast.error('Enter a valid card number')
      return
    }
    if (digits.endsWith('0000')) {
      toast.error('Payment declined (demo card ending 0000)')
      return
    }
    if (REQUIRES_CODE && !promoCode.trim()) {
      toast.error('Enter your subscription code')
      return
    }

    setProcessing(true)
    try {
      await new Promise((r) => setTimeout(r, 1400))
      const ok = await subscribe(promoCode)
      if (ok) {
        onOpenChange(false)
        await onSuccess?.()
      }
    } finally {
      setProcessing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Secure checkout
          </DialogTitle>
          <DialogDescription>
            Demo payment for {APP_NAME} Pro — no real money is charged.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border bg-muted/40 p-4 flex items-center justify-between gap-3">
          <div>
            <p className="font-medium">Pro plan</p>
            <p className="text-xs text-muted-foreground">Monthly · AI features unlocked</p>
          </div>
          <p className="text-xl font-bold">{formatProPrice()}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
        </div>

        <Badge variant="secondary" className="w-fit gap-1">
          <ShieldCheck className="w-3 h-3" />
          Demo gateway — use test card 4242…
        </Badge>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Name on card</label>
            <Input
              className="mt-1"
              placeholder="Jane Smith"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              disabled={processing}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Card number</label>
            <Input
              className="mt-1 font-mono"
              placeholder="4242 4242 4242 4242"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              disabled={processing}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Expiry</label>
              <Input
                className="mt-1 font-mono"
                placeholder="MM/YY"
                value={expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                disabled={processing}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">CVC</label>
              <Input
                className="mt-1 font-mono"
                placeholder="123"
                value={cvc}
                onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                disabled={processing}
              />
            </div>
          </div>
          {REQUIRES_CODE && (
            <div>
              <label className="text-xs font-medium text-muted-foreground">School code</label>
              <Input
                className="mt-1"
                placeholder="Subscription code"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                disabled={processing}
              />
            </div>
          )}
        </div>

        <Button className="w-full gap-2" onClick={() => void handlePay()} disabled={processing}>
          {processing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing payment…
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              Pay {formatProPrice()}
            </>
          )}
        </Button>

        <p className="text-[10px] text-center text-muted-foreground">
          Simulated payment only. Card data is not stored or sent to a processor.
        </p>
      </DialogContent>
    </Dialog>
  )
}
