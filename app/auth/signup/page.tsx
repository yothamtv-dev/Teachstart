'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { APP_NAME } from '@/lib/app-config'
import { ensurePublicUserProfile } from '@/lib/ensure-user-profile'
import { GraduationCap, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

type Role = 'teacher' | 'student'

export default function SignupPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    schoolName: '',
  })
  const [role, setRole] = useState<Role>('teacher')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const validate = () => {
    const next: Record<string, string> = {}
    if (!formData.fullName.trim()) next.fullName = 'Full name is required'
    if (!formData.email.trim()) next.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) next.email = 'Enter a valid email address'
    if (!formData.password) next.password = 'Password is required'
    else if (formData.password.length < 6) next.password = 'Password must be at least 6 characters'
    if (formData.password !== formData.confirmPassword) next.confirmPassword = 'Passwords do not match'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const email = formData.email.trim()
    const fullName = formData.fullName.trim()
    const schoolName = formData.schoolName.trim()

    setLoading(true)
    try {
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/login`,
          data: {
            full_name: fullName,
            school_name: schoolName || undefined,
            role,
          },
        },
      })

      if (signupError) throw signupError

      if (data.session?.user) {
        const { error: profileError } = await ensurePublicUserProfile(supabase, data.session.user)
        if (profileError) {
          console.error('[signup] Profile error:', profileError)
          toast.error('Account created but profile sync failed. Run scripts/patches/004-auth-user-profile-trigger.sql in Supabase, then sign in again.')
        }
      } else if (data.user) {
        // Email confirmation: no JWT yet, so client cannot insert public.users. Trigger patch 004 must be applied.
      }

      toast.success('Account created! Signing you in…')
      // Route based on role
      if (role === 'student') {
        router.push('/student/dashboard')
      } else {
        router.push('/dashboard')
      }
    } catch (error: any) {
      const msg = typeof error?.message === 'string' ? error.message : ''
      if (msg.includes('User already registered')) {
        toast.error('This email is already registered. Please sign in.')
        setErrors({ email: 'Already registered' })
      } else if (/signup(s)? not allowed|signups disabled/i.test(msg)) {
        toast.error('Signups are currently disabled for this project.')
      } else if (msg.includes('Invalid email')) {
        toast.error('Please enter a valid email address.')
        setErrors({ email: 'Invalid email' })
      } else if (error?.status === 422 && msg) {
        toast.error(msg)
      } else {
        toast.error(msg || 'Failed to create account. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">{APP_NAME}</h1>
          <p className="text-muted-foreground">Create your account</p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSignup} className="space-y-4" noValidate>
            {/* Role picker */}
            <div>
              <p className="text-sm font-medium mb-2">I am a…</p>
              <div className="grid grid-cols-2 gap-3">
                {(['teacher', 'student'] as Role[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={cn(
                      'flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-sm font-medium transition-all',
                      role === r
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-muted-foreground/20 hover:border-primary/50',
                    )}
                  >
                    {r === 'teacher' ? (
                      <BookOpen className="w-6 h-6" />
                    ) : (
                      <GraduationCap className="w-6 h-6" />
                    )}
                    <span className="capitalize">{r}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <Input
                type="text"
                name="fullName"
                placeholder="Jane Smith"
                value={formData.fullName}
                onChange={handleChange}
                className={errors.fullName ? 'border-destructive' : ''}
              />
              {errors.fullName && <p className="text-xs text-destructive mt-1">{errors.fullName}</p>}
            </div>

            {role === 'teacher' && (
              <div>
                <label className="block text-sm font-medium mb-1">School Name</label>
                <Input
                  type="text"
                  name="schoolName"
                  placeholder="Lincoln Elementary"
                  value={formData.schoolName}
                  onChange={handleChange}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <Input
                type="password"
                name="password"
                placeholder="At least 6 characters"
                value={formData.password}
                onChange={handleChange}
                required
                className={errors.password ? 'border-destructive' : ''}
              />
              {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Confirm Password</label>
              <Input
                type="password"
                name="confirmPassword"
                placeholder="Repeat your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className={errors.confirmPassword ? 'border-destructive' : ''}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-destructive mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating account…' : `Sign up as ${role === 'teacher' ? 'Teacher' : 'Student'}`}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link href="/auth/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
