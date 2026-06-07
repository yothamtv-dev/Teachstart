'use client'

import { useAuth } from '@/hooks/use-auth'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { Plus, BookOpen, Sparkles, BarChart3, Pencil, Eye, Compass, Zap } from 'lucide-react'
import { AISetupBanner } from '@/components/ai-setup-banner'

export default function DashboardHome() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({
    lessonsCount: 0,
    studentsCount: 0,
    avgEngagement: 0,
  })
  const [lessons, setLessons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      if (!profile) return

      try {
        const [lessonsRes, engagementRes] = await Promise.all([
          supabase
            .from('lessons')
            .select('*')
            .eq('user_id', profile.id)
            .order('created_at', { ascending: false }),
          supabase
            .from('student_engagement')
            .select('completion_percentage')
            .eq('teacher_id', profile.id),
        ])

        const avgCompletion =
          engagementRes.data && engagementRes.data.length > 0
            ? engagementRes.data.reduce((sum, e) => sum + (e.completion_percentage || 0), 0) /
              engagementRes.data.length
            : 0

        setLessons(lessonsRes.data || [])
        setStats({
          lessonsCount: lessonsRes.data?.length || 0,
          studentsCount: engagementRes.data?.length || 0,
          avgEngagement: Math.round(avgCompletion),
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [profile])

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <AISetupBanner className="mb-6" />
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Welcome, {profile?.full_name || 'Teacher'}!
        </h1>
        <p className="text-muted-foreground">
          {profile?.school_name && `${profile.school_name} • `}
          Manage your lessons and student engagement
        </p>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link href="/dashboard/discover">
          <Card className="p-6 hover:border-primary transition-colors cursor-pointer h-full">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold mb-1">Discover</h3>
                <p className="text-sm text-muted-foreground">
                  Udemy-style catalog, paths &amp; learner player
                </p>
              </div>
              <Compass className="w-6 h-6 text-primary" />
            </div>
          </Card>
        </Link>
        <Link href="/dashboard/lessons/new">
          <Card className="p-6 hover:border-primary transition-colors cursor-pointer h-full">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold mb-1">Create New Lesson</h3>
                <p className="text-sm text-muted-foreground">
                  Start building with the drag-and-drop editor
                </p>
              </div>
              <Plus className="w-6 h-6 text-primary" />
            </div>
          </Card>
        </Link>

        <Link href="/dashboard/builder">
          <Card className="p-6 hover:border-primary transition-colors cursor-pointer h-full">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold mb-1">AI Lesson Generator</h3>
                <p className="text-sm text-muted-foreground">
                  Generate lessons using AI
                </p>
              </div>
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
          </Card>
        </Link>

        <Link href="/dashboard/analytics">
          <Card className="p-6 hover:border-primary transition-colors cursor-pointer h-full">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold mb-1">View Analytics</h3>
                <p className="text-sm text-muted-foreground">
                  Track student engagement and performance
                </p>
              </div>
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
          </Card>
        </Link>
      </div>

      {/* Stats Section */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6">
            <div className="text-2xl font-bold">{stats.lessonsCount}</div>
            <p className="text-sm text-muted-foreground">Lessons Created</p>
          </Card>
          <Card className="p-6">
            <div className="text-2xl font-bold">{stats.studentsCount}</div>
            <p className="text-sm text-muted-foreground">Students Engaging</p>
          </Card>
          <Card className="p-6">
            <div className="text-2xl font-bold">{stats.avgEngagement}%</div>
            <p className="text-sm text-muted-foreground">Avg. Completion</p>
          </Card>
        </div>
      )}

      {/* Recent Lessons */}
      {lessons.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Recent Lessons</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lessons.slice(0, 6).map((lesson) => (
              <Card key={lesson.id} className="p-6 flex flex-col h-full">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2">{lesson.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {lesson.description || 'No description'}
                  </p>
                  {lesson.blocks && (
                    <p className="text-xs text-muted-foreground">
                      {lesson.blocks.length} blocks • {(lesson.blocks as any[]).reduce((sum, b) => sum + (b.duration || 0), 0)} min
                    </p>
                  )}
                </div>
                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <Link href={`/dashboard/lessons/${lesson.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                  </Link>
                  <Link href={`/dashboard/builder?id=${lesson.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Getting Started */}
      {lessons.length === 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Getting Started</h2>
          <div className="space-y-3 text-sm">
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                1
              </div>
              <div>
                <p className="font-medium">Create Your First Lesson</p>
                <p className="text-muted-foreground">
                  Use the drag-and-drop builder to create a lesson or let AI generate one for you
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                2
              </div>
              <div>
                <p className="font-medium">Customize with Content</p>
                <p className="text-muted-foreground">
                  Add text, images, videos, and quizzes to make your lesson engaging
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                3
              </div>
              <div>
                <p className="font-medium">Track Student Progress</p>
                <p className="text-muted-foreground">
                  Monitor engagement and see which students need support
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
