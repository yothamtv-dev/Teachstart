'use client'

import { useAuth } from '@/hooks/use-auth'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  User,
  KeyRound,
  ShieldCheck,
  LogOut,
  Save,
  AlertTriangle,
  Trash2,
} from 'lucide-react'

function AvatarCircle({ name, url }: { name: string; url?: string | null }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
  if (url) {
    return <img src={url} alt={name} className="w-20 h-20 rounded-full object-cover ring-2 ring-border" />
  }
  return (
    <div className="w-20 h-20 rounded-full bg-primary/10 text-primary font-bold text-2xl flex items-center justify-center ring-2 ring-border">
      {initials || '?'}
    </div>
  )
}

export default function StudentSettingsPage() {
  const { user, profile, logout, refreshProfile } = useAuth()
  const [fullName, setFullName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmNew, setConfirmNew] = useState('')
  const [changingPwd, setChangingPwd] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')

  useEffect(() => {
    if (!profile) return
    setFullName(profile.full_name ?? '')
    setAvatarUrl(profile.avatar_url ?? '')
    setBio(profile.bio ?? '')
    setDirty(false)
  }, [profile])

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({ full_name: fullName.trim() || null, avatar_url: avatarUrl.trim() || null, bio: bio.trim() || null, updated_at: new Date().toISOString() })
        .eq('id', user.id)
      if (error) throw error
      await refreshProfile()
      toast.success('Profile saved')
      setDirty(false)
    } catch (err: any) {
      toast.error(err.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    if (!newPassword) { toast.error('Enter a new password'); return }
    if (newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return }
    if (newPassword !== confirmNew) { toast.error('Passwords do not match'); return }
    setChangingPwd(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      toast.success('Password updated')
      setNewPassword(''); setConfirmNew('')
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password')
    } finally {
      setChangingPwd(false)
    }
  }

  const displayName = fullName || profile?.full_name || user?.email || 'Student'

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-6 pb-16">
      <h1 className="text-2xl font-bold">Account Settings</h1>

      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-4">
          <AvatarCircle name={displayName} url={avatarUrl || profile?.avatar_url} />
          <div>
            <p className="font-semibold text-lg">{displayName}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <Badge variant="secondary" className="mt-1 capitalize text-xs">Student</Badge>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium flex items-center gap-1.5 mb-1"><User className="w-3.5 h-3.5" />Full Name</label>
          <Input value={fullName} onChange={(e) => { setFullName(e.target.value); setDirty(true) }} placeholder="Your name" />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Email</label>
          <Input value={user?.email ?? ''} disabled className="opacity-60" />
          <p className="text-xs text-muted-foreground mt-1">Cannot be changed</p>
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => { setBio(e.target.value); setDirty(true) }}
            className="w-full border rounded-md p-2.5 text-sm resize-none h-20 bg-background"
            placeholder="Tell your teacher a bit about yourself…"
          />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Avatar URL</label>
          <Input value={avatarUrl} onChange={(e) => { setAvatarUrl(e.target.value); setDirty(true) }} placeholder="https://…" className="font-mono text-xs" />
        </div>
        <Button onClick={handleSave} disabled={saving || !dirty} className="gap-2">
          <Save className="w-4 h-4" />
          {saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
        </Button>
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="font-semibold flex items-center gap-2"><KeyRound className="w-4 h-4" />Change Password</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium block mb-1">New password</label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 6 characters" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Confirm password</label>
            <Input type="password" value={confirmNew} onChange={(e) => setConfirmNew(e.target.value)} placeholder="Repeat password" className={confirmNew && confirmNew !== newPassword ? 'border-destructive' : ''} />
          </div>
        </div>
        <Button variant="outline" disabled={changingPwd || !newPassword} onClick={handlePasswordChange} className="gap-2">
          <KeyRound className="w-4 h-4" />
          {changingPwd ? 'Updating…' : 'Update password'}
        </Button>
      </Card>

      <Card className="p-6 space-y-3">
        <h2 className="font-semibold flex items-center gap-2"><ShieldCheck className="w-4 h-4" />Security</h2>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Role</span>
          <Badge variant="outline">Student</Badge>
        </div>
        <Button variant="destructive" className="w-full gap-2" onClick={() => void logout()}>
          <LogOut className="w-4 h-4" /> Log out
        </Button>
      </Card>

      <Card className="p-6 border-destructive/50 space-y-4">
        <h2 className="font-semibold text-destructive flex items-center gap-2"><AlertTriangle className="w-4 h-4" />Danger Zone</h2>
        <p className="text-sm text-muted-foreground">Type your email to confirm account deletion.</p>
        <Input value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder={user?.email || ''} className="font-mono text-sm" />
        <Button variant="destructive" disabled={deleteConfirm !== user?.email} className="gap-2">
          <Trash2 className="w-4 h-4" /> Delete account
        </Button>
      </Card>
    </div>
  )
}
