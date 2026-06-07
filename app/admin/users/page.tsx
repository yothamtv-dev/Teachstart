'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Users } from 'lucide-react'

type UserRow = {
  id: string
  email: string
  full_name: string | null
  role: string
  subscription_tier: string
  school_name: string | null
  is_verified: boolean
  created_at: string
}

const ROLE_OPTIONS = ['teacher', 'student', 'admin'] as const
const TIER_OPTIONS = ['free', 'pro'] as const

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase
        .from('users')
        .select('id, email, full_name, role, subscription_tier, school_name, is_verified, created_at')
        .order('created_at', { ascending: false })
      setUsers((data || []) as UserRow[])
      setLoading(false)
    })()
  }, [])

  const updateRole = async (userId: string, newRole: string) => {
    const { error } = await supabase.from('users').update({ role: newRole }).eq('id', userId)
    if (error) { toast.error('Failed to update role'); return }
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)))
    toast.success('Role updated')
  }

  const updateTier = async (userId: string, newTier: string) => {
    const { error } = await supabase.from('users').update({ subscription_tier: newTier }).eq('id', userId)
    if (error) { toast.error('Failed to update plan'); return }
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, subscription_tier: newTier } : u)))
    toast.success('Plan updated')
  }

  const toggleVerified = async (userId: string, current: boolean) => {
    const { error } = await supabase.from('users').update({ is_verified: !current }).eq('id', userId)
    if (error) { toast.error('Failed to update'); return }
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, is_verified: !current } : u)))
    toast.success(!current ? 'User verified' : 'Verification removed')
  }

  const filtered = users.filter(
    (u) =>
      !search ||
      (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.full_name || '').toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="w-6 h-6" />Manage Users</h1>
        <input
          type="text"
          placeholder="Search by email or name…"
          className="border rounded-lg px-3 py-1.5 text-sm w-64 bg-background"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((u) => (
            <Card key={u.id} className="p-4 flex flex-wrap items-center gap-3 justify-between">
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{u.full_name || '—'}</p>
                <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                {u.school_name && (
                  <p className="text-xs text-muted-foreground">{u.school_name}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Joined {new Date(u.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {u.is_verified && (
                  <Badge variant="secondary" className="text-xs">Verified</Badge>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => toggleVerified(u.id, u.is_verified)}
                >
                  {u.is_verified ? 'Unverify' : 'Verify'}
                </Button>
                <select
                  className="border rounded px-2 py-1 text-xs bg-background capitalize"
                  value={u.subscription_tier || 'free'}
                  onChange={(e) => updateTier(u.id, e.target.value)}
                >
                  {TIER_OPTIONS.map((t) => (
                    <option key={t} value={t} className="capitalize">{t}</option>
                  ))}
                </select>
                <select
                  className="border rounded px-2 py-1 text-xs bg-background capitalize"
                  value={u.role || 'teacher'}
                  onChange={(e) => updateRole(u.id, e.target.value)}
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r} className="capitalize">{r}</option>
                  ))}
                </select>
              </div>
            </Card>
          ))}
          {filtered.length === 0 && (
            <p className="text-muted-foreground text-sm">No users match your search.</p>
          )}
        </div>
      )}
    </div>
  )
}
