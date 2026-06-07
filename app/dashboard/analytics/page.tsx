'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { GraduationCap, School } from 'lucide-react'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export default function AnalyticsPage() {
  const { user } = useAuth()
  const [view, setView] = useState<'teacher' | 'admin'>('teacher')
  const [engagementData, setEngagementData] = useState<any[]>([])
  const [lessonStats, setLessonStats] = useState<any[]>([])
  const [coverage, setCoverage] = useState<{ aligned: number; total: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user) return

      try {
        const { data: engagementRes } = await supabase
          .from('student_engagement')
          .select('*')
          .eq('teacher_id', user.id)

        if (engagementRes?.length) {
          const grouped = engagementRes.reduce((acc: any[], curr: any) => {
            const date = curr.created_at?.split('T')[0] || 'Unknown'
            const existing = acc.find((item: any) => item.date === date)
            const completion = curr.completion_percentage ?? 0
            if (existing) {
              existing.avg_completion = (existing.avg_completion + completion) / 2
              existing.records = (existing.records || 1) + 1
            } else {
              acc.push({
                date,
                avg_completion: completion,
                records: 1,
              })
            }
            return acc
          }, [])

          setEngagementData(grouped.sort((a: any, b: any) => a.date.localeCompare(b.date)))
        }

        const { data: lessonsRes } = await supabase
          .from('lessons')
          .select('id, title, subject, duration_minutes, lesson_blocks(id)')
          .eq('user_id', user.id)
          .is('deleted_at', null)

        if (lessonsRes?.length) {
          setLessonStats(
            lessonsRes.map((lesson: any) => ({
              name: lesson.title.length > 22 ? lesson.title.slice(0, 22) + '…' : lesson.title,
              blocks: lesson.lesson_blocks?.length || 0,
              duration: lesson.duration_minutes || 0,
            })),
          )
        }

        const lessonIds = (lessonsRes || []).map((l: any) => l.id)
        if (lessonIds.length) {
          const { data: links } = await supabase
            .from('lesson_standards')
            .select('lesson_id')
            .in('lesson_id', lessonIds)
          const unique = new Set((links || []).map((r: any) => r.lesson_id))
          setCoverage({ aligned: unique.size, total: lessonIds.length })
        } else {
          setCoverage({ aligned: 0, total: 0 })
        }
      } catch (error) {
        console.error('Error fetching analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [user])

  const avgCompletion =
    engagementData.length > 0
      ? (
          engagementData.reduce((sum, d) => sum + (d.avg_completion || 0), 0) /
          engagementData.length
        ).toFixed(1)
      : '0'

  const adminMock = {
    departments: 4,
    activeTeachers: 28,
    institutionalCoverage: coverage ? Math.round((coverage.aligned / Math.max(coverage.total, 1)) * 100) : 0,
    lessonsCompletedThisWeek: lessonStats.length * 3 + 12,
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Personal velocity, engagement signals, and a demo administrator lens for institutional coverage.
          </p>
        </div>
        <div className="flex rounded-lg border p-1 bg-muted/50 w-fit">
          <Button
            type="button"
            variant={view === 'teacher' ? 'default' : 'ghost'}
            size="sm"
            className="gap-2"
            onClick={() => setView('teacher')}
          >
            <GraduationCap className="w-4 h-4" />
            Teacher
          </Button>
          <Button
            type="button"
            variant={view === 'admin' ? 'default' : 'ghost'}
            size="sm"
            className="gap-2"
            onClick={() => setView('admin')}
          >
            <School className="w-4 h-4" />
            Admin demo
          </Button>
        </div>
      </div>

      {view === 'teacher' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-1">Avg. completion</p>
              <p className="text-3xl font-bold">{avgCompletion}%</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-1">Lessons tracked</p>
              <p className="text-3xl font-bold">{lessonStats.length}</p>
            </Card>
            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-1">Curriculum-linked lessons</p>
              <p className="text-3xl font-bold">
                {coverage ? `${coverage.aligned}/${coverage.total}` : '—'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">With ≥1 standard in lesson_standards</p>
            </Card>
          </div>

          {engagementData.length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-bold mb-4">Engagement trend</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={engagementData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="avg_completion" stroke="#3b82f6" name="Avg completion %" />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}

          {lessonStats.length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-bold mb-4">Lesson overview</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Blocks per lesson</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={lessonStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-35} textAnchor="end" height={90} tick={{ fontSize: 11 }} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="blocks" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <h3 className="font-semibold mb-3">Planned duration mix</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={lessonStats}
                        dataKey="duration"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                      >
                        {lessonStats.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Card>
          )}
        </>
      )}

      {view === 'admin' && (
        <div className="space-y-6">
          <Card className="p-6 border-dashed">
            <Badge variant="secondary" className="mb-2">
              Simulated data
            </Badge>
            <p className="text-sm text-muted-foreground mb-4">
              Wire this view to your SIS or multi-tenant tables. Numbers below blend your real lesson count with
              illustrative school-wide KPIs.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-4 bg-muted/40">
                <p className="text-xs text-muted-foreground">Departments</p>
                <p className="text-2xl font-bold">{adminMock.departments}</p>
              </Card>
              <Card className="p-4 bg-muted/40">
                <p className="text-xs text-muted-foreground">Active teachers (demo)</p>
                <p className="text-2xl font-bold">{adminMock.activeTeachers}</p>
              </Card>
              <Card className="p-4 bg-muted/40">
                <p className="text-xs text-muted-foreground">Your curriculum coverage</p>
                <p className="text-2xl font-bold">{adminMock.institutionalCoverage}%</p>
              </Card>
              <Card className="p-4 bg-muted/40">
                <p className="text-xs text-muted-foreground">Lessons completed (demo)</p>
                <p className="text-2xl font-bold">{adminMock.lessonsCompletedThisWeek}</p>
              </Card>
            </div>
          </Card>
        </div>
      )}

      {loading && (
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">Loading analytics…</p>
        </Card>
      )}
    </div>
  )
}
