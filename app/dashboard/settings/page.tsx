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
  School,
  BookOpen,
  ShieldCheck,
  LogOut,
  KeyRound,
  Trash2,
  Plus,
  X,
  Save,
  AlertTriangle,
  Crown,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useProAccess } from '@/hooks/use-pro-access'
import { SubscribeButton, CancelProButton } from '@/components/subscribe-button'
import { formatProPrice } from '@/lib/payment-config'

const GRADE_OPTIONS = [
  'Pre-K', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12',
  'Higher Ed',
]
const SUBJECT_OPTIONS = [
  'Mathematics', 'English Language Arts', 'Science', 'Social Studies', 'History',
  'Geography', 'Physics', 'Chemistry', 'Biology', 'Computer Science',
  'Art', 'Music', 'Physical Education', 'Foreign Language', 'Special Education',
]

function AvatarCircle({ name, url, size = 'lg' }: { name: string; url?: string | null; size?: 'sm' | 'lg' }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
  const sz = size === 'lg' ? 'w-20 h-20 text-2xl' : 'w-8 h-8 text-sm'
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className={cn('rounded-full object-cover ring-2 ring-border', sz)}
      />
    )
  }
  return (
    <div
      className={cn(
        'rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center ring-2 ring-border',
        sz,
      )}
    >
      {initials || '?'}
    </div>
  )
}

function TagInput({
  label,
  values,
  options,
  onChange,
}: {
  label: string
  values: string[]
  options: string[]
  onChange: (v: string[]) => void
}) {
  const available = options.filter((o) => !values.includes(o))
  return (
    <div>
      <p className="text-sm font-medium mb-2">{label}</p>
      <div className="flex flex-wrap gap-1.5 mb-2 min-h-[32px]">
        {values.map((v) => (
          <Badge key={v} variant="secondary" className="gap-1 pr-1">
            {v}
            <button
              type="button"
              onClick={() => onChange(values.filter((x) => x !== v))}
              className="ml-0.5 hover:text-destructive"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
        {values.length === 0 && (
          <span className="text-xs text-muted-foreground italic">None selected</span>
        )}
      </div>
      {available.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {available.slice(0, 12).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onChange([...values, opt])}
              className="text-xs border rounded-full px-2.5 py-0.5 hover:bg-primary/10 hover:border-primary transition-colors flex items-center gap-0.5"
            >
              <Plus className="w-2.5 h-2.5" />
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const PRO_FEATURES = [
  'AI lesson generation',
  'AI quiz question banks',
  'Quality & time analysis',
  'Curriculum alignment & gap scans',
]

export default function SettingsPage() {
  const { user, profile, logout, refreshProfile } = useAuth()
  const { isPro, tier } = useProAccess()

  const [fullName, setFullName] = useState('')
  const [schoolName, setSchoolName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [subjects, setSubjects] = useState<string[]>([])
  const [gradeLevels, setGradeLevels] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  // Password change
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNew, setConfirmNew] = useState('')
  const [changingPwd, setChangingPwd] = useState(false)

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState('')

  useEffect(() => {
    if (!profile) return
    setFullName(profile.full_name ?? '')
    setSchoolName(profile.school_name ?? '')
    setBio(profile.bio ?? '')
    setAvatarUrl(profile.avatar_url ?? '')
    setSubjects(profile.subjects ?? [])
    setGradeLevels(profile.grade_levels ?? [])
    setDirty(false)
  }, [profile])

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: fullName.trim() || null,
          school_name: schoolName.trim() || null,
          bio: bio.trim() || null,
          avatar_url: avatarUrl.trim() || null,
          subjects,
          grade_levels: gradeLevels,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error
      await refreshProfile()
      toast.success('Profile saved')
      setDirty(false)
    } catch (err: any) {
      toast.error(err.message || 'Failed to save profile')
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
      toast.success('Password updated successfully')
      setCurrentPassword(''); setNewPassword(''); setConfirmNew('')
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password')
    } finally {
      setChangingPwd(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== user?.email) {
      toast.error('Email does not match')
      return
    }
    // Supabase doesn't allow client-side self-delete — inform user
    toast.error(
      'Account deletion requires a server-side action. Contact your administrator to remove your account.',
    )
  }

  const markDirty = <T,>(setter: (v: T) => void) =>
    (v: T) => { setter(v); setDirty(true) }

  const displayName = fullName || profile?.full_name || user?.email || 'User'

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto space-y-6 pb-16">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
      </div>

      <Card id="subscription" className="p-6 space-y-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Crown className="w-5 h-5 text-violet-600" />
              Subscription
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Unlock AI-powered planning tools with a Pro subscription.
            </p>
          </div>
          <Badge variant={isPro ? 'default' : 'secondary'} className="capitalize">
            {isPro ? 'Pro' : tier}
          </Badge>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-lg border p-4 bg-muted/30">
            <p className="font-medium">Free</p>
            <p className="text-2xl font-bold mt-1">$0</p>
            <p className="text-xs text-muted-foreground mt-1">Lesson builder, assignments, community</p>
          </div>
          <div className="rounded-lg border-2 border-violet-500/50 p-4 bg-violet-50/50 dark:bg-violet-950/20">
            <p className="font-medium text-violet-900 dark:text-violet-100">Pro</p>
            <p className="text-2xl font-bold mt-1 text-violet-900 dark:text-violet-100">
              {formatProPrice()}<span className="text-sm font-normal text-muted-foreground">/month</span>
            </p>
            <p className="text-xs text-muted-foreground">Demo checkout — no real charges</p>
            <ul className="text-xs text-muted-foreground mt-2 space-y-1">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-violet-600 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {isPro ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              You have full access to AI features.
              {profile?.subscription_status && (
                <span className="text-xs capitalize">({profile.subscription_status})</span>
              )}
            </p>
            {profile?.role !== 'admin' && (
              <CancelProButton onSuccess={() => void refreshProfile()} />
            )}
          </div>
        ) : (
          <SubscribeButton
            size="default"
            label="Subscribe to Pro"
            onSuccess={() => void refreshProfile()}
          />
        )}
      </Card>

      {/* Profile card */}
      <Card className="p-6 space-y-5">
        <div className="flex items-center gap-4">
          <AvatarCircle name={displayName} url={avatarUrl || profile?.avatar_url} />
          <div>
            <p className="font-semibold text-lg leading-tight">{displayName}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            {profile?.role && (
              <Badge variant="secondary" className="mt-1 capitalize text-xs">
                {profile.role}
              </Badge>
            )}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium flex items-center gap-1.5 mb-1">
              <User className="w-3.5 h-3.5" /> Full Name
            </label>
            <Input
              value={fullName}
              onChange={(e) => markDirty(setFullName)(e.target.value)}
              placeholder="Jane Smith"
            />
          </div>

          <div>
            <label className="text-sm font-medium flex items-center gap-1.5 mb-1">
              <User className="w-3.5 h-3.5" /> Email
            </label>
            <Input value={user?.email ?? ''} disabled className="opacity-60" />
            <p className="text-xs text-muted-foreground mt-1">Cannot be changed here</p>
          </div>

          <div className="sm:col-span-2">
            <label className="text-sm font-medium flex items-center gap-1.5 mb-1">
              <School className="w-3.5 h-3.5" /> School / Institution
            </label>
            <Input
              value={schoolName}
              onChange={(e) => markDirty(setSchoolName)(e.target.value)}
              placeholder="Lincoln Elementary School"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-sm font-medium flex items-center gap-1.5 mb-1">
              <BookOpen className="w-3.5 h-3.5" /> Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => markDirty(setBio)(e.target.value)}
              placeholder="Tell others a bit about yourself…"
              className="w-full border rounded-md p-2.5 text-sm resize-none h-24 bg-background"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-sm font-medium flex items-center gap-1.5 mb-1">Avatar URL</label>
            <Input
              value={avatarUrl}
              onChange={(e) => markDirty(setAvatarUrl)(e.target.value)}
              placeholder="https://… (leave blank for initials)"
              className="font-mono text-xs"
            />
          </div>
        </div>

        <TagInput
          label="Subjects you teach"
          values={subjects}
          options={SUBJECT_OPTIONS}
          onChange={markDirty(setSubjects)}
        />

        <TagInput
          label="Grade levels"
          values={gradeLevels}
          options={GRADE_OPTIONS}
          onChange={markDirty(setGradeLevels)}
        />

        <Button onClick={handleSave} disabled={saving || !dirty} className="gap-2">
          <Save className="w-4 h-4" />
          {saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
        </Button>
      </Card>

      {/* Password change */}
      <Card className="p-6 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <KeyRound className="w-4 h-4" /> Change Password
        </h2>
        <p className="text-sm text-muted-foreground">
          Leave new password blank to keep your current password.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium block mb-1">New password</label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Confirm new password</label>
            <Input
              type="password"
              value={confirmNew}
              onChange={(e) => setConfirmNew(e.target.value)}
              placeholder="Repeat new password"
              className={confirmNew && confirmNew !== newPassword ? 'border-destructive' : ''}
            />
          </div>
        </div>
        <Button
          variant="outline"
          disabled={changingPwd || !newPassword}
          onClick={handlePasswordChange}
          className="gap-2"
        >
          <KeyRound className="w-4 h-4" />
          {changingPwd ? 'Updating…' : 'Update password'}
        </Button>
      </Card>

      {/* Security */}
      <Card className="p-6 space-y-3">
        <h2 className="font-semibold flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" /> Security
        </h2>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Account role</span>
          <Badge variant="outline" className="capitalize">{profile?.role || 'teacher'}</Badge>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Verified</span>
          <Badge variant={profile?.is_verified ? 'default' : 'outline'}>
            {profile?.is_verified ? 'Yes' : 'No'}
          </Badge>
        </div>
        <Button variant="destructive" className="w-full gap-2 mt-2" onClick={() => void logout()}>
          <LogOut className="w-4 h-4" />
          Log out
        </Button>
      </Card>

      {/* Danger zone */}
      <Card className="p-6 border-destructive/50 space-y-4">
        <h2 className="font-semibold text-destructive flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> Danger Zone
        </h2>
        <p className="text-sm text-muted-foreground">
          To confirm account deletion, type your email address below and click Delete.
        </p>
        <Input
          value={deleteConfirm}
          onChange={(e) => setDeleteConfirm(e.target.value)}
          placeholder={user?.email || 'your@email.com'}
          className="font-mono text-sm"
        />
        <Button
          variant="destructive"
          disabled={deleteConfirm !== user?.email}
          onClick={handleDeleteAccount}
          className="gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Delete account
        </Button>
      </Card>
    </div>
  )
}
