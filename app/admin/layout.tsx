'use client'

import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ShieldCheck, Users, Database, Activity, LogOut } from 'lucide-react'

function AdminShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, profile, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/auth/login')
      } else if (profile && profile.role !== 'admin') {
        router.push('/dashboard')
      }
    }
  }, [isAuthenticated, loading, profile, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <p className="text-muted-foreground max-w-md">
          Could not load your admin profile. Refresh the page or sign in again.
        </p>
      </div>
    )
  }

  if (profile.role !== 'admin') return null

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-20 border-b bg-card/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link href="/admin" className="flex items-center gap-2 font-bold text-lg">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Admin Console
          </Link>
          <nav className="hidden sm:flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin"><Activity className="w-4 h-4 mr-1.5" />Overview</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/users"><Users className="w-4 h-4 mr-1.5" />Users</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/curriculum"><Database className="w-4 h-4 mr-1.5" />Curriculum</Link>
            </Button>
          </nav>
          <Button variant="ghost" size="sm" onClick={() => void logout()} className="gap-1">
            <LogOut className="w-4 h-4" /> Logout
          </Button>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>
}
