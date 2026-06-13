'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { ResolvedSpecies } from '@/lib/core'
import type { SupplementalEntry } from '@/lib/data/tree-runtime'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuth } from './auth'

interface SupplementalState {
  entries: SupplementalEntry[]
  loading: boolean
  /** 追加できるか（ログイン済み or ローカル専用モード）。 */
  canAdd: boolean
  /** 不適切な追加を削除できる管理者か。 */
  isAdmin: boolean
  localOnly: boolean
  add: (
    gbifUsageKey: number,
    resolved: ResolvedSpecies,
  ) => Promise<{ ok: boolean; message?: string }>
  remove: (gbifUsageKey: number) => Promise<{ ok: boolean; message?: string }>
}

const SupplementalContext = createContext<SupplementalState | null>(null)
const LOCAL_KEY = 'supplemental:v1'
const hasStorage = () => typeof window !== 'undefined' && !!window.localStorage

function loadLocal(): SupplementalEntry[] {
  if (!hasStorage()) return []
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '[]') as SupplementalEntry[]
  } catch {
    return []
  }
}
function saveLocal(entries: SupplementalEntry[]) {
  if (hasStorage()) localStorage.setItem(LOCAL_KEY, JSON.stringify(entries))
}

interface Row {
  gbif_usage_key: number
  resolved: ResolvedSpecies
  created_by: string | null
  created_at: string
}
const rowToEntry = (r: Row): SupplementalEntry => ({
  gbifUsageKey: r.gbif_usage_key,
  resolved: r.resolved,
  createdBy: r.created_by,
  createdAt: r.created_at,
})

export function SupplementalProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [entries, setEntries] = useState<SupplementalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  const reload = useCallback(async () => {
    if (!supabase) {
      setEntries(loadLocal())
      setLoading(false)
      return
    }
    const { data } = await supabase
      .from('supplemental_taxa')
      .select('gbif_usage_key, resolved, created_by, created_at')
      .order('created_at', { ascending: true })
    setEntries(((data as Row[] | null) ?? []).map(rowToEntry))
    setLoading(false)
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  // 管理者判定（自分が admins にいるか）。
  useEffect(() => {
    if (!supabase) {
      setIsAdmin(true) // ローカル専用モードでは本人が管理者
      return
    }
    if (!user) {
      setIsAdmin(false)
      return
    }
    let cancelled = false
    supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setIsAdmin(!!data)
      })
    return () => {
      cancelled = true
    }
  }, [user])

  const add = useCallback<SupplementalState['add']>(
    async (gbifUsageKey, resolved) => {
      if (entries.some((e) => e.gbifUsageKey === gbifUsageKey)) {
        return { ok: false, message: 'すでに追加されています' }
      }
      if (!supabase) {
        const entry: SupplementalEntry = {
          gbifUsageKey,
          resolved,
          createdAt: new Date().toISOString(),
        }
        const next = [...entries, entry]
        setEntries(next)
        saveLocal(next)
        return { ok: true }
      }
      if (!user) return { ok: false, message: '追加するにはログインが必要です' }
      const { error } = await supabase.from('supplemental_taxa').insert({
        gbif_usage_key: gbifUsageKey,
        resolved,
        created_by: user.id,
      })
      if (error) {
        return {
          ok: false,
          message:
            error.code === '23505' ? 'すでに追加されています' : error.message,
        }
      }
      await reload()
      return { ok: true }
    },
    [entries, user, reload],
  )

  const remove = useCallback<SupplementalState['remove']>(
    async (gbifUsageKey) => {
      if (!supabase) {
        const next = entries.filter((e) => e.gbifUsageKey !== gbifUsageKey)
        setEntries(next)
        saveLocal(next)
        return { ok: true }
      }
      if (!isAdmin) return { ok: false, message: '削除は管理者のみ可能です' }
      const { error } = await supabase
        .from('supplemental_taxa')
        .delete()
        .eq('gbif_usage_key', gbifUsageKey)
      if (error) return { ok: false, message: error.message }
      await reload()
      return { ok: true }
    },
    [entries, isAdmin, reload],
  )

  const value = useMemo<SupplementalState>(
    () => ({
      entries,
      loading,
      canAdd: isSupabaseConfigured ? !!user : true,
      isAdmin,
      localOnly: !isSupabaseConfigured,
      add,
      remove,
    }),
    [entries, loading, user, isAdmin, add, remove],
  )

  return (
    <SupplementalContext.Provider value={value}>
      {children}
    </SupplementalContext.Provider>
  )
}

export function useSupplemental(): SupplementalState {
  const ctx = useContext(SupplementalContext)
  if (!ctx) throw new Error('useSupplemental must be used within SupplementalProvider')
  return ctx
}
