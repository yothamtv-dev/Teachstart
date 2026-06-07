'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, BookOpen, Database, Zap, ArrowRight } from 'lucide-react'

type Stats = {
  usersTotal: number
  teachers: number
  students: number
  lessons: number
  aiRequests: number
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentUsers, setRecentUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const [usersRes, lessonsRes, aiRes] = await Promise.all([
        supabase.from('users').select('id, role, full_name, email, created_at').order('created_at', { ascending: false }),
        supabase.from('lessons').select('id', { count: 'exact', head: true }),
        supabase.from('ai_generation_logs').select('id', { count: 'exact', head: true }),
      ])
      const users = usersRes.data || []
      setRecentUsers(users.slice(0, 8))
      setStats({
        usersTotal: users.length,
        teachers: users.filter((u) => u.role === 'teacher' || !u.role).length,
        students: users.filter((u) => u.role === 'student').length,
        lessons: lessonsRes.count || 0,
        aiRequests: aiRes.count || 0,
      })
      setLoading(false)
    })()
  }, [])

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-2xl font-bold">System Overview</h1>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : stats ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { label: 'Total Users', value: stats.usersTotal, icon: Users, color: 'blue' },
            { label: 'Teachers', value: stats.teachers, icon: BookOpen, color: 'purple' },
            { label: 'Students', value: stats.students, icon: Users, color: 'green' },
            { label: 'Lessons', value: stats.lessons, icon: BookOpen, color: 'orange' },
            { label: 'AI Requests', value: stats.aiRequests, icon: Zap, color: 'yellow' },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="p-4">
              <div className={`w-8 h-8 rounded-full bg-${color}-100 dark:bg-${color}-900/30 flex items-center justify-center mb-2`}>
                <Icon className={`w-4 h-4 text-${color}-600`} />
              </div>
              <div className="text-2xl font-bold">{value}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </Card>
          ))}
        </div>
      ) : null}

      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold flex items-center gap-2"><Users className="w-4 h-4" />Users</h2>
            <Button size="sm" variant="ghost" asChild>
              <Link href="/admin/users">Manage <ArrowRight className="w-3.5 h-3.5 ml-1" /></Link>
            </Button>
          </div>
          {recentUsers.length > 0 && (
            <ul className="text-sm space-y-2">
              {recentUsers.map((u) => (
                <li key={u.id} className="flex items-center justify-between gap-2">
                  <span className="truncate text-muted-foreground">{u.email}</span>
                  <span className="capitalize text-xs border rounded px-1.5 py-0.5 shrink-0">{u.role || 'teacher'}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold flex items-center gap-2"><Database className="w-4 h-4" />Curriculum</h2>
            <Button size="sm" variant="ghost" asChild>
              <Link href="/admin/curriculum">Manage <ArrowRight className="w-3.5 h-3.5 ml-1" /></Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Upload official Ministry CSV/JSON standards files to keep the curriculum database current.
          </p>
          <Button className="mt-3 gap-2" size="sm" asChild>
            <Link href="/admin/curriculum"><Database className="w-4 h-4" />Upload Standards</Link>
          </Button>
        </Card>
      </div>
    </div>
  )
}
