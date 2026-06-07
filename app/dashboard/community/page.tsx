'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Download, Star } from 'lucide-react'

type PeerLesson = {
  id: string
  lesson_id: string
  creator_id: string
  title: string
  description: string | null
  subject: string
  grade_level: string
  download_count: number | null
  rating: number | null
  is_approved: boolean
}

export default function CommunityPage() {
  const { user } = useAuth()
  const [community, setCommunity] = useState<PeerLesson[]>([])
  const [mine, setMine] = useState<PeerLesson[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'community' | 'my-shared'>('community')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const { data: all } = await supabase
          .from('peer_lessons')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(60)

        const rows = (all || []) as PeerLesson[]
        setCommunity(rows.filter((r) => r.is_approved))
        if (user) {
          setMine(rows.filter((r) => r.creator_id === user.id))
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  const list = tab === 'community' ? community : mine
  const filtered = list.filter(
    (l) =>
      l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.subject.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Peer marketplace</h1>
        <p className="text-muted-foreground mt-2">
          Publish high-scoring lessons for colleagues. Listings use the <code className="text-xs bg-muted px-1 rounded">peer_lessons</code> table — share from &quot;My Lessons&quot;.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
        <div className="flex gap-2 border rounded-lg p-1 bg-muted w-fit">
          <button
            type="button"
            onClick={() => setTab('community')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === 'community' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'
            }`}
          >
            Approved hub
          </button>
          <button
            type="button"
            onClick={() => setTab('my-shared')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === 'my-shared' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'
            }`}
          >
            My listings
          </button>
        </div>
        <Input
          placeholder="Search title or subject…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 max-w-md"
        />
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading community…</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((lesson) => (
            <Card key={lesson.id} className="p-5 flex flex-col h-full">
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{lesson.subject}</Badge>
                  <Badge variant="outline">{lesson.grade_level}</Badge>
                  {!lesson.is_approved && tab === 'my-shared' && (
                    <Badge variant="destructive">Pending review</Badge>
                  )}
                </div>
                <h3 className="font-semibold text-lg leading-snug">{lesson.title}</h3>
                {lesson.description && (
                  <p className="text-sm text-muted-foreground line-clamp-3">{lesson.description}</p>
                )}
                <div className="flex gap-4 text-xs text-muted-foreground pt-2">
                  <span className="flex items-center gap-1">
                    <Download className="w-3.5 h-3.5" />
                    {lesson.download_count ?? 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5" />
                    {lesson.rating != null ? lesson.rating.toFixed(1) : '—'}
                  </span>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-4" asChild>
                <Link href={`/dashboard/lessons/${lesson.lesson_id}`}>
                  <BookOpen className="w-4 h-4 mr-2" />
                  Open source lesson
                </Link>
              </Button>
            </Card>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <Card className="p-10 text-center text-muted-foreground">
          {tab === 'community'
            ? 'No approved listings yet. Share a lesson from My Lessons to seed the marketplace.'
            : 'You have not published any lessons yet.'}
        </Card>
      )}
    </div>
  )
}
