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
import { bundledCatalog, type CatalogEntry } from '@/lib/data/catalog'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuth } from './auth'

interface CatalogState {
  /** カタログ全件（フルーツの種）。 */
  entries: CatalogEntry[]
  loading: boolean
  /** 追加できるか（ログイン済み or ローカル専用モード）。 */
  canAdd: boolean
  /** どの項目でも削除できる管理者か（ローカル専用モードでは常に true）。 */
  isAdmin: boolean
  localOnly: boolean
  add: (resolved: ResolvedSpecies) => Promise<{ ok: boolean; message?: string }>
  remove: (id: string) => Promise<{ ok: boolean; message?: string }>
}

const CatalogContext = createContext<CatalogState | null>(null)

const hasStorage = () => typeof window !== 'undefined' && !!window.localStorage
const CACHE_KEY = 'taxa:cache:v1' // Supabase 取得結果のオフラインキャッシュ
const LOCAL_ADDS = 'taxa:local-adds:v1' // ローカル専用モードの追加
const LOCAL_HIDDEN = 'taxa:local-hidden:v1' // ローカル専用モードの削除

function readJson<T>(key: string, fallback: T): T {
  if (!hasStorage()) return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}
function writeJson(key: string, value: unknown) {
  if (hasStorage()) localStorage.setItem(key, JSON.stringify(value))
}

interface Row {
  id: string
  resolved: ResolvedSpecies
  created_by: string | null
  created_at: string
}
const rowToEntry = (r: Row): CatalogEntry => ({
  id: r.id,
  resolved: r.resolved,
  createdAt: r.created_at,
})

/** ローカル専用モードのカタログ＝同梱 ＋ ローカル追加 − ローカル削除。 */
function localEntries(): CatalogEntry[] {
  const adds = readJson<CatalogEntry[]>(LOCAL_ADDS, [])
  const hidden = new Set(readJson<string[]>(LOCAL_HIDDEN, []))
  const byId = new Map<string, CatalogEntry>()
  for (const e of [...bundledCatalog, ...adds]) byId.set(e.id, e)
  return [...byId.values()].filter((e) => !hidden.has(e.id))
}

export function CatalogProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [entries, setEntries] = useState<CatalogEntry[]>(() =>
    isSupabaseConfigured
      ? readJson<CatalogEntry[]>(CACHE_KEY, bundledCatalog)
      : bundledCatalog,
  )
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(!isSupabaseConfigured)

  // 起動時：Supabase からカタログ取得（成功でキャッシュ更新）。未設定ならローカル合成。
  useEffect(() => {
    if (!supabase) {
      setEntries(localEntries())
      setLoading(false)
      return
    }
    let cancelled = false
    supabase
      .from('taxa')
      .select('id, resolved, created_by, created_at')
      .then(({ data, error }) => {
        if (cancelled) return
        if (!error && data) {
          const next = (data as Row[]).map(rowToEntry)
          setEntries(next)
          writeJson(CACHE_KEY, next)
        }
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // 管理者判定。
  useEffect(() => {
    if (!supabase) {
      setIsAdmin(true)
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

  const add = useCallback<CatalogState['add']>(
    async (resolved) => {
      if (entries.some((e) => e.id === resolved.id)) {
        return { ok: false, message: 'すでに収録されています' }
      }
      const now = new Date().toISOString()
      const entry: CatalogEntry = { id: resolved.id, resolved, createdAt: now }

      if (!supabase) {
        const adds = readJson<CatalogEntry[]>(LOCAL_ADDS, [])
        writeJson(LOCAL_ADDS, [...adds, entry])
        setEntries(localEntries())
        return { ok: true }
      }
      if (!user) return { ok: false, message: '追加するにはログインが必要です' }
      const { error } = await supabase
        .from('taxa')
        .insert({ id: resolved.id, resolved, created_by: user.id })
      if (error) {
        return {
          ok: false,
          message: error.code === '23505' ? 'すでに収録されています' : error.message,
        }
      }
      const next = [...entries, entry]
      setEntries(next)
      writeJson(CACHE_KEY, next)
      return { ok: true }
    },
    [entries, user],
  )

  const remove = useCallback<CatalogState['remove']>(
    async (id) => {
      if (!supabase) {
        const adds = readJson<CatalogEntry[]>(LOCAL_ADDS, []).filter((e) => e.id !== id)
        writeJson(LOCAL_ADDS, adds)
        const hidden = readJson<string[]>(LOCAL_HIDDEN, [])
        writeJson(LOCAL_HIDDEN, [...new Set([...hidden, id])])
        setEntries(localEntries())
        return { ok: true }
      }
      if (!isAdmin) return { ok: false, message: '削除は管理者のみ可能です' }
      const { error } = await supabase.from('taxa').delete().eq('id', id)
      if (error) return { ok: false, message: error.message }
      const next = entries.filter((e) => e.id !== id)
      setEntries(next)
      writeJson(CACHE_KEY, next)
      return { ok: true }
    },
    [entries, isAdmin],
  )

  const value = useMemo<CatalogState>(
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

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
}

export function useCatalog(): CatalogState {
  const ctx = useContext(CatalogContext)
  if (!ctx) throw new Error('useCatalog must be used within CatalogProvider')
  return ctx
}
