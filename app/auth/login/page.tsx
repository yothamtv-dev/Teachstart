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

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      toast.error('Email and password are required')
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) throw error

      if (data.user) {
        const { error: profileErr } = await ensurePublicUserProfile(supabase, data.user)
        if (profileErr) {
          console.error('[login] Profile sync:', profileErr)
          toast.error('Signed in, but profile row could not be created. Try running DB patch 004 (auth trigger).')
        }
      }

      toast.success('Logged in successfully!')
      // Fetch role and route accordingly
      const userId = data.user?.id
      if (userId) {
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', userId)
          .single()
        const role = profile?.role ?? 'teacher'
        if (role === 'student') {
          router.push('/student/dashboard')
        } else if (role === 'admin') {
          router.push('/admin')
        } else {
          router.push('/dashboard')
        }
      } else {
        router.push('/dashboard')
      }
    } catch (error: any) {
      console.error('[v0] Login failed:', error)
      
      // Provide helpful error messages
      if (error.message?.includes('Invalid login credentials')) {
        toast.error('Invalid email or password. Please try again.')
      } else if (error.message?.includes('Email not confirmed')) {
        toast.error('Please verify your email before signing in.')
      } else if (error.status === 429) {
        toast.error('Too many login attempts. Please wait a few minutes.')
      } else {
        toast.error(error.message || 'Failed to log in. Please try again.')
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
          <p className="text-muted-foreground">AI-Powered Lesson Planning</p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            <span className="text-muted-foreground">Don&apos;t have an account? </span>
            <Link href="/auth/signup" className="text-primary hover:underline font-medium">
              Sign up
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
