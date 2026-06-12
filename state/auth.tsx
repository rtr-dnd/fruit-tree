'use client'

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

export interface AppUser {
  id: string
  email?: string
  name?: string
  avatarUrl?: string
}

interface AuthState {
  user: AppUser | null
  loading: boolean
  /** Supabase 未設定（ローカル専用モード）か。 */
  configured: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

function toAppUser(u: {
  id: string
  email?: string
  user_metadata?: Record<string, unknown>
}): AppUser {
  const meta = u.user_metadata ?? {}
  return {
    id: u.id,
    email: u.email,
    name: (meta.full_name as string) || (meta.name as string) || u.email,
    avatarUrl: (meta.avatar_url as string) || (meta.picture as string),
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ? toAppUser(data.session.user) : null)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ? toAppUser(session.user) : null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      configured: isSupabaseConfigured,
      async signInWithGoogle() {
        if (!supabase) {
          alert(
            'Supabase が未設定です。ローカル保存モードで動作中です（記録は端末内に保存されます）。',
          )
          return
        }
        // 認証は Sign in with Google のみ（§4.5）。
        await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: window.location.origin },
        })
      },
      async signOut() {
        if (supabase) await supabase.auth.signOut()
        setUser(null)
      },
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
