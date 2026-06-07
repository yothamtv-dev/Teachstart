'use client'

import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { GraduationCap, BookOpen, BarChart3, LogOut, Home, Settings } from 'lucide-react'
import { APP_NAME } from '@/lib/app-config'

function StudentShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, logout, profile } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top nav */}
      <header className="sticky top-0 z-20 border-b bg-card/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link href="/student/dashboard" className="flex items-center gap-2 font-bold text-lg">
            <GraduationCap className="w-5 h-5 text-primary" />
            <span>{APP_NAME}</span>
            <span className="text-xs font-medium bg-primary/10 text-primary rounded-full px-2 py-0.5 ml-1">
              Student
            </span>
          </Link>
          <nav className="hidden sm:flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/student/dashboard">
                <Home className="w-4 h-4 mr-1.5" />
                Dashboard
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/student/lessons">
                <BookOpen className="w-4 h-4 mr-1.5" />
                My Lessons
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/student/scores">
                <BarChart3 className="w-4 h-4 mr-1.5" />
                My Scores
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/student/settings">
                <Settings className="w-4 h-4 mr-1.5" />
                Settings
              </Link>
            </Button>
          </nav>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {profile?.full_name || profile?.email}
            </span>
            <Button variant="ghost" size="sm" onClick={() => void logout()} className="gap-1">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
}

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return <StudentShell>{children}</StudentShell>
}
