'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { User } from '@/lib/supabase'
import { upsertPublicUserProfileRow } from '@/lib/ensure-user-profile'
import { isAdminEmail } from '@/lib/admin-emails'

type AuthContextValue = {
  user: SupabaseUser | null
  profile: User | null
  loading: boolean
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const profileLoadedForUser = useRef<string | null>(null)

  const fetchProfile = useCallback(async (authUser: SupabaseUser) => {
    try {
      const { data, error } = await supabase.from('users').select('*').eq('id', authUser.id).maybeSingle()

      if (error) {
        console.error('Error fetching profile:', error)
        setProfile(null)
        return
      }

      if (data) {
        if (isAdminEmail(authUser.email) && data.role !== 'admin') {
          const { data: promoted, error: promoteErr } = await upsertPublicUserProfileRow(
            supabase,
            authUser,
          )
          if (promoteErr) {
            console.error('Error promoting admin profile:', promoteErr)
            setProfile(data as User)
            return
          }
          setProfile((promoted as User) ?? (data as User))
          return
        }
        setProfile(data as User)
        return
      }

      const { data: created, error: upsertError } = await upsertPublicUserProfileRow(supabase, authUser)
      if (upsertError) {
        console.error('Error creating profile row:', upsertError)
        setProfile(null)
        return
      }

      setProfile((created as User) ?? null)
    } catch (err) {
      console.error('Error fetching profile:', err)
      setProfile(null)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const stopLoading = () => {
      if (!cancelled) setLoading(false)
    }

    const loadProfile = (authUser: SupabaseUser, force = false) => {
      if (!force && profileLoadedForUser.current === authUser.id) {
        stopLoading()
        return
      }
      profileLoadedForUser.current = authUser.id
      void fetchProfile(authUser).finally(stopLoading)
    }

    // Never leave the shell spinner running indefinitely (stale tab, hung auth lock, etc.)
    const loadingTimeout = window.setTimeout(stopLoading, 12_000)

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return
      const authUser = session?.user ?? null
      setUser(authUser)
      if (authUser) {
        loadProfile(authUser)
      } else {
        profileLoadedForUser.current = null
        setProfile(null)
        stopLoading()
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Async work inside this callback can deadlock Supabase auth (e.g. on TOKEN_REFRESHED).
      window.setTimeout(() => {
        if (cancelled) return

        if (event === 'TOKEN_REFRESHED') {
          if (session?.user) setUser(session.user)
          return
        }

        const authUser = session?.user ?? null
        setUser(authUser)

        if (!authUser) {
          profileLoadedForUser.current = null
          setProfile(null)
          stopLoading()
          return
        }

        if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          loadProfile(authUser, true)
          return
        }

        if (event === 'INITIAL_SESSION') {
          loadProfile(authUser)
        }
      }, 0)
    })

    return () => {
      cancelled = true
      window.clearTimeout(loadingTimeout)
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    router.push('/auth/login')
  }, [router])

  const refreshProfile = useCallback(async () => {
    if (!user) return
    const { data } = await supabase.from('users').select('*').eq('id', user.id).maybeSingle()
    if (data && isAdminEmail(user.email) && data.role !== 'admin') {
      const { data: promoted } = await upsertPublicUserProfileRow(supabase, user)
      if (promoted) {
        setProfile(promoted as User)
        return
      }
    }
    if (data) setProfile(data as User)
  }, [user])

  const value: AuthContextValue = {
    user,
    profile,
    loading,
    logout,
    refreshProfile,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
