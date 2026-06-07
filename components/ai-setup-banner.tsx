'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, CheckCircle2, X, ExternalLink, Zap, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { authenticatedFetch } from '@/lib/authenticated-fetch'
import { useProAccess } from '@/hooks/use-pro-access'

type AIStatus = {
  configured: boolean
  provider: 'openai' | 'google' | 'none'
  model: string | null
  access?: {
    pro: boolean
    tier: 'free' | 'pro'
  }
}

let cachedStatus: AIStatus | null = null

export function AISetupBanner({ className }: { className?: string }) {
  const [status, setStatus] = useState<AIStatus | null>(cachedStatus)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (cachedStatus) { setStatus(cachedStatus); return }
    authenticatedFetch('/api/ai-status')
      .then((r) => r.json())
      .then((d) => { cachedStatus = d; setStatus(d) })
      .catch(() => {})
  }, [])

  if (!status || status.configured || dismissed) return null

  return (
    <div
      className={cn(
        'rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 p-4 flex items-start gap-3',
        className,
      )}
    >
      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0 space-y-2">
        <p className="font-semibold text-amber-800 dark:text-amber-200 text-sm">
          AI features are not configured
        </p>
        <p className="text-sm text-amber-700 dark:text-amber-300">
          Add an API key to <code className="bg-amber-100 dark:bg-amber-900/50 px-1 rounded text-xs">.env.local</code> and
          restart the dev server to enable AI generation, question creation, and curriculum alignment.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button size="sm" variant="outline" className="gap-1.5 border-amber-400 text-amber-800 dark:text-amber-200 h-7 text-xs" asChild>
            <Link href="/setup" target="_blank">
              <Zap className="w-3.5 h-3.5" /> Setup guide
            </Link>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="gap-1.5 text-amber-700 dark:text-amber-300 h-7 text-xs"
            onClick={() => {
              navigator.clipboard.writeText('OPENAI_API_KEY=sk-...')
              toast.success('Copied to clipboard')
            }}
          >
            <Copy className="w-3.5 h-3.5" /> Copy env template
          </Button>
          <Button size="sm" variant="ghost" className="gap-1.5 text-amber-700 dark:text-amber-300 h-7 text-xs" asChild>
            <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer">
              <ExternalLink className="w-3.5 h-3.5" /> Get OpenAI key
            </a>
          </Button>
          <Button size="sm" variant="ghost" className="gap-1.5 text-amber-700 dark:text-amber-300 h-7 text-xs" asChild>
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer">
              <ExternalLink className="w-3.5 h-3.5" /> Get Gemini key
            </a>
          </Button>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="shrink-0 text-amber-500 hover:text-amber-700"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

/** Small pill shown in navbars / sidebars */
export function AIStatusPill() {
  const [status, setStatus] = useState<AIStatus | null>(cachedStatus)
  const { isPro, tier } = useProAccess()

  useEffect(() => {
    if (cachedStatus) { setStatus(cachedStatus); return }
    authenticatedFetch('/api/ai-status')
      .then((r) => r.json())
      .then((d) => { cachedStatus = d; setStatus(d) })
      .catch(() => {})
  }, [])

  if (!status) return null

  const canUseAI = status.configured && isPro

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[10px] rounded-full px-2 py-0.5 font-medium',
        canUseAI
          ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
          : !status.configured
            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
            : 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
      )}
      title={
        !status.configured
          ? 'AI not configured'
          : isPro
            ? `AI: ${status.provider} / ${status.model}`
            : 'Upgrade to Pro to use AI features'
      }
    >
      {!status.configured ? (
        <><AlertTriangle className="w-3 h-3" /> No AI</>
      ) : isPro ? (
        <><CheckCircle2 className="w-3 h-3" /> Pro AI</>
      ) : (
        <><AlertTriangle className="w-3 h-3" /> {tier} plan</>
      )}
    </span>
  )
}
