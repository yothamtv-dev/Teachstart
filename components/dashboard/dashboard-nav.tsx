'use client'

import { useEffect, useRef, useState } from 'react'
import { useTheme } from 'next-themes'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookOpen, LogOut, Moon, Sun, Settings, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { AIStatusPill } from '@/components/ai-setup-banner'
import { APP_NAME } from '@/lib/app-config'

function AvatarCircle({ name, url }: { name: string; url?: string | null }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className="w-8 h-8 rounded-full object-cover ring-1 ring-border"
      />
    )
  }
  return (
    <div className="w-8 h-8 rounded-full bg-primary/15 text-primary font-bold text-xs flex items-center justify-center ring-1 ring-border select-none">
      {initials || '?'}
    </div>
  )
}

export default function DashboardNav() {
  const { user, profile, logout } = useAuth()
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => setMounted(true), [])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const displayName = profile?.full_name || user?.email || 'Account'

  return (
    <nav className="border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 sticky top-0 z-30">
      <div className="max-w-[1600px] mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg shrink-0">
          <BookOpen className="w-6 h-6 text-primary" />
          <span className="hidden sm:inline">{APP_NAME}</span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          <AIStatusPill />
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            type="button"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
            disabled={!mounted}
          >
            {!mounted ? (
              <Moon className="h-4 w-4 opacity-50" />
            ) : resolvedTheme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          {/* Profile dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-muted transition-colors"
              aria-expanded={menuOpen}
              aria-haspopup="true"
            >
              <AvatarCircle name={displayName} url={profile?.avatar_url} />
              <span className="hidden sm:block text-sm font-medium max-w-[130px] truncate">
                {displayName}
              </span>
              <ChevronDown className={cn('w-3.5 h-3.5 text-muted-foreground transition-transform', menuOpen && 'rotate-180')} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-60 rounded-xl border bg-popover shadow-lg z-50 overflow-hidden py-1">
                {/* User info */}
                <div className="px-4 py-3 border-b">
                  <div className="flex items-center gap-3">
                    <AvatarCircle name={displayName} url={profile?.avatar_url} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{displayName}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                      {profile?.role && (
                        <Badge variant="secondary" className="text-[10px] h-4 mt-0.5 capitalize">
                          {profile.role}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {profile?.school_name && (
                    <p className="text-xs text-muted-foreground mt-2 truncate">{profile.school_name}</p>
                  )}
                </div>

                {/* Subject tags */}
                {profile?.subjects && profile.subjects.length > 0 && (
                  <div className="px-4 py-2 border-b flex flex-wrap gap-1">
                    {profile.subjects.slice(0, 4).map((s) => (
                      <Badge key={s} variant="outline" className="text-[10px] h-4">{s}</Badge>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <Link
                  href="/dashboard/settings"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                >
                  <Settings className="w-4 h-4 text-muted-foreground" />
                  Settings
                </Link>
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); void logout() }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
