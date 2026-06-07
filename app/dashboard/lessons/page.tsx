'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Pencil, Trash2, Eye, Share2, Plus, Play } from 'lucide-react'
import { toast } from 'sonner'

export default function LessonsPage() {
  const { user } = useAuth()
  const [lessons, setLessons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (!user) return

    const fetchLessons = async () => {
      try {
        const { data, error } = await supabase
          .from('lessons')
          .select('*, lesson_blocks(id)')
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })

        if (error) throw error
        setLessons(data || [])
      } catch (error) {
        console.error('Error fetching lessons:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLessons()
  }, [user])

  const handleDelete = async (lessonId: string) => {
    if (!confirm('Are you sure you want to delete this lesson?')) return

    try {
      await supabase.from('lessons').delete().eq('id', lessonId)
      setLessons(lessons.filter((l) => l.id !== lessonId))
    } catch (error) {
      console.error('Error deleting lesson:', error)
      alert('Failed to delete lesson')
    }
  }

  const handleShare = async (lessonId: string) => {
    if (!user) return

    const lesson = lessons.find((l) => l.id === lessonId)
    if (!lesson) return

    try {
      const { data: existing } = await supabase
        .from('peer_lessons')
        .select('id')
        .eq('lesson_id', lessonId)
        .maybeSingle()

      if (existing) {
        toast.message('Already in peer marketplace')
        return
      }

      const { error: pubErr } = await supabase
        .from('lessons')
        .update({ is_published: true })
        .eq('id', lessonId)
      if (pubErr) console.warn(pubErr)

      const { error } = await supabase.from('peer_lessons').insert({
        lesson_id: lessonId,
        creator_id: user.id,
        title: lesson.title,
        description: lesson.description,
        subject: lesson.subject || 'General',
        grade_level: lesson.grade_level || 'Unspecified',
        is_approved: true,
      })

      if (error) throw error
      setLessons(lessons.map((l) => (l.id === lessonId ? { ...l, is_published: true } : l)))
      toast.success('Published — learners can open it from Discover & Community.')
    } catch (error) {
      console.error('Error sharing lesson:', error)
      toast.error('Could not publish. Check peer_lessons and RLS in Supabase.')
    }
  }

  const filteredLessons = lessons.filter((l) =>
    l.title.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">My lessons</h1>
          <p className="text-muted-foreground mt-2">
            Edit, open the MOOC-style player, publish to Discover, or list on the peer hub
          </p>
        </div>
        <Link href="/dashboard/builder">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create lesson
          </Button>
        </Link>
      </div>

      <Input
        placeholder="Search lessons…"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-md"
      />

      {!loading && filteredLessons.length > 0 ? (
        <div className="border rounded-lg overflow-hidden bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/80 border-b">
              <tr>
                <th className="p-4 text-left font-semibold">Title</th>
                <th className="p-4 text-left font-semibold">Blocks</th>
                <th className="p-4 text-left font-semibold">Duration</th>
                <th className="p-4 text-left font-semibold">Created</th>
                <th className="p-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLessons.map((lesson) => {
                const blockCount = lesson.lesson_blocks?.length ?? 0
                const totalDuration =
                  lesson.duration_minutes ??
                  lesson.estimated_duration_minutes ??
                  0
                const createdDate = new Date(lesson.created_at).toLocaleDateString()

                return (
                  <tr key={lesson.id} className="border-b hover:bg-muted/40">
                    <td className="p-4">
                      <p className="font-medium">{lesson.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {lesson.subject} · {lesson.grade_level}
                      </p>
                    </td>
                    <td className="p-4">{blockCount}</td>
                    <td className="p-4">{totalDuration} min</td>
                    <td className="p-4 text-muted-foreground">{createdDate}</td>
                    <td className="p-4 text-right">
                      <div className="flex gap-1 justify-end flex-wrap">
                        <Link href={`/dashboard/lessons/${lesson.id}`}>
                          <Button variant="ghost" size="sm" type="button" title="Overview">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Link href={`/dashboard/learn/${lesson.id}`}>
                          <Button variant="ghost" size="sm" type="button" title="Learner player">
                            <Play className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Link href={`/dashboard/builder?id=${lesson.id}`}>
                          <Button variant="ghost" size="sm" type="button">
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="sm" type="button" onClick={() => handleShare(lesson.id)}>
                          <Share2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          type="button"
                          onClick={() => handleDelete(lesson.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : loading ? (
        <Card className="p-12 text-center">
          <p>Loading lessons…</p>
        </Card>
      ) : (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-4">No lessons yet</p>
          <Link href="/dashboard/builder">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create your first lesson
            </Button>
          </Link>
        </Card>
      )}
    </div>
  )
}
