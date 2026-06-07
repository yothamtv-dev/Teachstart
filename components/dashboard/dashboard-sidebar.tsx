'use client'

import Link from 'next/link'
import { APP_NAME } from '@/lib/app-config'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  FileText,
  BarChart3,
  Share2,
  Settings,
  Plus,
  Library,
  Home,
  BookMarked,
  Compass,
  Users,
} from 'lucide-react'

const menuItems = [
  { label: 'Dashboard', href: '/dashboard', icon: Home },
  { label: 'Discover', href: '/dashboard/discover', icon: Compass },
  { label: 'Create Lesson', href: '/dashboard/builder', icon: Plus },
  { label: 'My Lessons', href: '/dashboard/lessons', icon: FileText },
  { label: 'Assign to Students', href: '/dashboard/assign', icon: Users },
  { label: 'Curriculum', href: '/dashboard/curriculum', icon: BookMarked },
  { label: 'Templates', href: '/dashboard/templates', icon: Library },
  { label: 'Community', href: '/dashboard/community', icon: Share2 },
  { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export default function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 border-r bg-muted/30 flex flex-col">
      <div className="p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname.startsWith(item.href)

          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? 'default' : 'ghost'}
                className="w-full justify-start gap-2"
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Button>
            </Link>
          )
        })}
      </div>

      <div className="flex-1" />

      <div className="p-4 border-t">
        <p className="text-xs text-muted-foreground text-center">
          {APP_NAME} v0.1.0
        </p>
      </div>
    </aside>
  )
}
