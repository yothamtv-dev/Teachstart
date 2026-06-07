import Link from 'next/link'
import { APP_NAME } from '@/lib/app-config'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowRight,
  BookMarked,
  Layers,
  LineChart,
  Share2,
  Sparkles,
  Timer,
  Wand2,
} from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-background via-background to-muted/40">
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <span className="font-bold text-lg tracking-tight">{APP_NAME}</span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/auth/login">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/auth/signup">Start free</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="max-w-6xl mx-auto px-4 pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-4">
              Lesson lifecycle · Curriculum · Community
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.1]">
              Plan lessons at the speed of thought —{' '}
              <span className="text-primary">aligned, timed, and shareable.</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              Drag-and-drop builder, generative AI drafts, standards mapping, gap scans across your week, reusability
              scoring, and a peer marketplace — built for teachers who refuse to live in twelve different tabs.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button size="lg" className="gap-2" asChild>
                <Link href="/auth/signup">
                  Open workspace
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/auth/login">I already have an account</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="border-y bg-muted/30">
          <div className="max-w-6xl mx-auto px-4 py-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: Layers,
                title: 'Visual block builder',
                body: 'Reorder warm-ups, core instruction, labs, and checks with drag-and-drop — zero layout friction.',
              },
              {
                icon: Wand2,
                title: 'AI lesson & question banks',
                body: 'Full-structure generation plus per-block assessments with Bloom tagging and explanations.',
              },
              {
                icon: BookMarked,
                title: 'Standards & gap intelligence',
                body: 'Map to your curriculum database and run holistic scans before testing windows hit.',
              },
              {
                icon: Timer,
                title: 'Bell-schedule fit',
                body: 'Time estimates from density, modality, and activity type — tuned for 45–60 minute realities.',
              },
              {
                icon: LineChart,
                title: 'Quality & analytics',
                body: 'Reusability scoring, engagement trends, and an admin-style coverage lens for your school.',
              },
              {
                icon: Share2,
                title: 'Peer marketplace',
                body: 'Publish vetted lessons; colleagues import and adapt instead of rebuilding from scratch.',
              },
            ].map(({ icon: Icon, title, body }) => (
              <Card key={title} className="p-6 border-muted/80 hover:border-primary/30 transition-colors">
                <Icon className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 py-20 text-center">
          <Sparkles className="w-10 h-10 mx-auto text-primary mb-4" />
          <h2 className="text-2xl md:text-3xl font-bold">Ready when you are</h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            Connect Supabase + OpenAI in minutes. Your templates, curriculum seeds, and peer listings are yours to
            extend.
          </p>
          <Button size="lg" className="mt-8" asChild>
            <Link href="/auth/signup">Create your workspace</Link>
          </Button>
        </section>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        {APP_NAME} — built for educators.
      </footer>
    </div>
  )
}
