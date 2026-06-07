'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Copy,
  ArrowRight,
  Sparkles,
  Database,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type Check = { label: string; ok: boolean | null; detail: string }

export default function SetupPage() {
  const [checks, setChecks] = useState<Check[]>([
    { label: 'Supabase URL', ok: null, detail: '' },
    { label: 'Supabase Key', ok: null, detail: '' },
    { label: 'AI Provider', ok: null, detail: '' },
  ])
  const [aiStatus, setAiStatus] = useState<any>(null)

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

    setChecks((prev) => [
      {
        label: 'Supabase URL',
        ok: !!supabaseUrl,
        detail: supabaseUrl
          ? `✓ ${supabaseUrl.replace(/https:\/\/([^.]+).*/, 'https://$1…')}`
          : 'NEXT_PUBLIC_SUPABASE_URL missing from .env.local',
      },
      {
        label: 'Supabase Key',
        ok: !!supabaseKey,
        detail: supabaseKey
          ? `✓ Key found (${supabaseKey.slice(0, 20)}…)`
          : 'NEXT_PUBLIC_SUPABASE_ANON_KEY missing from .env.local',
      },
      prev[2],
    ])

    fetch('/api/ai-status')
      .then((r) => r.json())
      .then((d) => {
        setAiStatus(d)
        setChecks((prev) => [
          prev[0],
          prev[1],
          {
            label: 'AI Provider',
            ok: d.configured,
            detail: d.configured
              ? `✓ ${d.provider} / ${d.model}`
              : 'No OPENAI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY found',
          },
        ])
      })
      .catch(() => {})
  }, [])

  const allOk = checks.every((c) => c.ok === true)
  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied`)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-2">
            <Zap className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Teach smart Setup</h1>
          <p className="text-muted-foreground">
            Configure your environment to enable all features
          </p>
        </div>

        {/* Status checks */}
        <Card className="p-6 space-y-3">
          <h2 className="font-semibold text-base mb-4">Environment Check</h2>
          {checks.map((c) => (
            <div key={c.label} className="flex items-start gap-3">
              {c.ok === null ? (
                <div className="w-5 h-5 rounded-full border-2 border-muted animate-pulse shrink-0 mt-0.5" />
              ) : c.ok ? (
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="text-sm font-medium">{c.label}</p>
                <p className={cn('text-xs', c.ok ? 'text-muted-foreground' : 'text-red-600 dark:text-red-400')}>
                  {c.detail || 'Checking…'}
                </p>
              </div>
            </div>
          ))}
          {allOk && (
            <div className="mt-4 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              All systems go! AI features are fully enabled.
            </div>
          )}
        </Card>

        {/* Step 1: Supabase */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">1</div>
            <h2 className="font-semibold flex items-center gap-2"><Database className="w-4 h-4" />Supabase (Database)</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Supabase stores users, lessons, blocks, and analytics. Create a free project at{' '}
            <a href="https://supabase.com" className="text-primary underline" target="_blank" rel="noreferrer">supabase.com</a>.
          </p>
          <div className="rounded-lg bg-muted p-3 font-mono text-xs space-y-1 relative">
            <p># .env.local</p>
            <p>NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co</p>
            <p>NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key</p>
            <button
              type="button"
              onClick={() => copy('NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co\nNEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key', 'Supabase template')}
              className="absolute top-2 right-2 p-1 rounded hover:bg-background/50"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs" asChild>
              <a href="https://supabase.com/dashboard/projects" target="_blank" rel="noreferrer">
                <ExternalLink className="w-3.5 h-3.5" /> Open Supabase Dashboard
              </a>
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs" asChild>
              <Link href="/dashboard">Run schema.sql →</Link>
            </Button>
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>Where to find your keys:</strong> Supabase Dashboard → Project → Settings → API</p>
            <p><strong>Schema:</strong> Run <code className="bg-muted px-1 rounded">scripts/schema.sql</code> then <code className="bg-muted px-1 rounded">scripts/patches/002-roles-assignments-quizzes.sql</code> in the SQL Editor.</p>
            <p>
              <strong>Admin users:</strong> Add{' '}
              <code className="bg-muted px-1 rounded">NEXT_PUBLIC_ADMIN_EMAILS=you@school.edu</code> to{' '}
              <code className="bg-muted px-1 rounded">.env.local</code> (comma-separated list, case-insensitive). Those
              accounts get <code className="bg-muted px-1 rounded">public.users.role = &apos;admin&apos;</code> when the
              profile sync runs (sign-in / app load). Restart the dev server after changing env vars.
            </p>
          </div>
        </Card>

        {/* Step 2: AI Provider */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">2</div>
            <h2 className="font-semibold flex items-center gap-2"><Sparkles className="w-4 h-4" />AI Provider (choose one)</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Teach smart uses AI for lesson generation, quiz questions, and curriculum alignment. Choose either OpenAI or Google Gemini — both are supported.
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* OpenAI */}
            <div className="rounded-xl border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm">OpenAI</p>
                <Badge variant="secondary" className="text-xs">Recommended</Badge>
              </div>
              <p className="text-xs text-muted-foreground">GPT-4o-mini. Fast and cost-effective. ~$0.003 per lesson generation.</p>
              <div className="rounded bg-muted p-2 font-mono text-xs relative">
                <p>OPENAI_API_KEY=sk-proj-...</p>
                <button type="button" onClick={() => copy('OPENAI_API_KEY=sk-proj-...', 'OpenAI template')} className="absolute top-1 right-1 p-1 hover:bg-background/50 rounded">
                  <Copy className="w-3 h-3" />
                </button>
              </div>
              <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs" asChild>
                <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer">
                  <ExternalLink className="w-3.5 h-3.5" /> Get OpenAI API key
                </a>
              </Button>
            </div>

            {/* Gemini */}
            <div className="rounded-xl border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm">Google Gemini</p>
                <Badge variant="outline" className="text-xs">Free tier available</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Gemini 2.0 Flash. Generous free tier — great for getting started.</p>
              <div className="rounded bg-muted p-2 font-mono text-xs relative">
                <p>GOOGLE_GENERATIVE_AI_API_KEY=AIza...</p>
                <button type="button" onClick={() => copy('GOOGLE_GENERATIVE_AI_API_KEY=AIza...', 'Gemini template')} className="absolute top-1 right-1 p-1 hover:bg-background/50 rounded">
                  <Copy className="w-3 h-3" />
                </button>
              </div>
              <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs" asChild>
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer">
                  <ExternalLink className="w-3.5 h-3.5" /> Get Gemini API key
                </a>
              </Button>
            </div>
          </div>

          <div className="text-xs text-muted-foreground space-y-1 border-t pt-3">
            <p><strong>If both keys are set</strong>, OpenAI takes priority.</p>
            <p><strong>After adding a key</strong>, stop the dev server (<kbd className="bg-muted px-1 rounded">Ctrl+C</kbd>) and run <kbd className="bg-muted px-1 rounded">npm run dev</kbd> again — Next.js reads env vars at startup.</p>
          </div>
        </Card>

        {/* Step 3: Complete .env.local */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">3</div>
            <h2 className="font-semibold">Complete .env.local example</h2>
          </div>
          <div className="rounded-lg bg-muted p-4 font-mono text-xs leading-6 relative">
            <pre>{`# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY

# AI Provider — add ONE of the following:
OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE
# or
# GOOGLE_GENERATIVE_AI_API_KEY=AIzaSy_YOUR_KEY_HERE

# Optional
NEXT_PUBLIC_APP_NAME=Teach smart
NEXT_PUBLIC_APP_URL=http://localhost:3000`}</pre>
            <button
              type="button"
              onClick={() =>
                copy(
                  `# Supabase (required)\nNEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co\nNEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY\n\n# AI Provider — add ONE of the following:\nOPENAI_API_KEY=sk-proj-YOUR_KEY_HERE\n# or\n# GOOGLE_GENERATIVE_AI_API_KEY=AIzaSy_YOUR_KEY_HERE\n\n# Optional\nNEXT_PUBLIC_APP_NAME=Teach smart\nNEXT_PUBLIC_APP_URL=http://localhost:3000`,
                  '.env.local template',
                )
              }
              className="absolute top-2 right-2 p-1.5 rounded hover:bg-background/50"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </Card>

        {/* AI features overview */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold">What AI enables</h2>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            {[
              { icon: '🧠', title: 'AI Lesson Generator', desc: 'Generate full lesson plans from a topic, grade, and subject in seconds.' },
              { icon: '❓', title: 'Quiz Questions', desc: 'Auto-create MCQ, true/false, and short-answer questions for any block.' },
              { icon: '📚', title: 'Curriculum Alignment', desc: 'Map your lesson to official standards with strength scores and gap analysis.' },
              { icon: '⏱️', title: 'Time Estimation', desc: 'Estimate realistic delivery time broken down by activity type.' },
              { icon: '📊', title: 'Plan Gap Analysis', desc: 'Analyze your full lesson portfolio for cross-lesson gaps and risks.' },
              { icon: '⭐', title: 'Quality Score', desc: 'Score lessons on clarity, engagement, reusability, and completeness.' },
            ].map((f) => (
              <div key={f.title} className="flex gap-3">
                <span className="text-xl shrink-0">{f.icon}</span>
                <div>
                  <p className="font-medium text-sm">{f.title}</p>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex gap-3 justify-center pt-2">
          <Button asChild className="gap-2">
            <Link href="/dashboard">
              Go to Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/auth/signup">Create account</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
