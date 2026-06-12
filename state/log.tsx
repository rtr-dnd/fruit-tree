'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { FruitLog, FruitLogEntry } from '@/lib/core'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuth } from './auth'

export interface LogState {
  log: FruitLog
  /** 記録の編集が可能か（ログイン済み or ローカル専用モード / §4.5）。 */
  canEdit: boolean
  /** 編集不可の理由（'login' = ログインが必要）。 */
  blockReason: 'login' | null
  /** ローカル専用モード（Supabase 未設定）。 */
  localOnly: boolean
  /** 同期待ちの書き込み件数（§11 オフライン記録）。 */
  pending: number
  syncing: boolean
  /** 初期ロード/同期前か（バッジを skeleton 表示する / §11）。 */
  hydrated: boolean
  get: (taxonId: string) => FruitLogEntry | undefined
  save: (
    taxonId: string,
    patch: Partial<Omit<FruitLogEntry, 'taxonId' | 'updatedAt'>>,
  ) => void
  remove: (taxonId: string) => void
}

const LogContext = createContext<LogState | null>(null)

const nowIso = () => new Date().toISOString()
const storageKey = (scope: string) => `fruitlog:v1:${scope}`
const queueKey = (scope: string) => `fruitlog:v1:queue:${scope}`
const hasStorage = () => typeof window !== 'undefined' && !!window.localStorage

function loadLocal(scope: string): FruitLog {
  const map: FruitLog = new Map()
  if (!hasStorage()) return map
  try {
    const raw = localStorage.getItem(storageKey(scope))
    if (raw) {
      const arr = JSON.parse(raw) as FruitLogEntry[]
      for (const e of arr) map.set(e.taxonId, e)
    }
  } catch {
    /* ignore */
  }
  return map
}

function saveLocal(scope: string, log: FruitLog) {
  if (!hasStorage()) return
  try {
    localStorage.setItem(storageKey(scope), JSON.stringify([...log.values()]))
  } catch {
    /* ignore */
  }
}

function loadQueue(scope: string): string[] {
  if (!hasStorage()) return []
  try {
    const raw = localStorage.getItem(queueKey(scope))
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}
function saveQueue(scope: string, ids: string[]) {
  if (!hasStorage()) return
  localStorage.setItem(queueKey(scope), JSON.stringify([...new Set(ids)]))
}

interface SupabaseRow {
  taxon_id: string
  tried: boolean
  rating: number | null
  notes: string | null
  place: string | null
  tried_date: string | null
  updated_at: string
}

function rowToEntry(r: SupabaseRow): FruitLogEntry {
  return {
    taxonId: r.taxon_id,
    tried: r.tried,
    rating: r.rating,
    notes: r.notes,
    place: r.place,
    triedDate: r.tried_date,
    updatedAt: r.updated_at,
  }
}

function entryToRow(e: FruitLogEntry, userId: string) {
  return {
    user_id: userId,
    taxon_id: e.taxonId,
    tried: e.tried,
    rating: e.rating ?? null,
    notes: e.notes ?? null,
    place: e.place ?? null,
    tried_date: e.triedDate ?? null,
    updated_at: e.updatedAt,
  }
}

export function LogProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const scope = user?.id ?? 'guest'
  // SSR では localStorage に触れない。空で初期化し、マウント後に読み込む。
  const [log, setLog] = useState<FruitLog>(() => new Map())
  const [pending, setPending] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const logRef = useRef(log)
  logRef.current = log

  // スコープ（ユーザー）切替時にローカルを読み直し（クライアント専用）。
  useEffect(() => {
    setLog(loadLocal(scope))
    setPending(loadQueue(scope).length)
    setHydrated(true)
  }, [scope])

  const persist = useCallback(
    (next: FruitLog) => {
      setLog(new Map(next))
      saveLocal(scope, next)
    },
    [scope],
  )

  const flushQueue = useCallback(async () => {
    if (!supabase || !user) return
    const ids = loadQueue(scope)
    if (ids.length === 0) return
    setSyncing(true)
    const remaining: string[] = []
    for (const id of ids) {
      const entry = logRef.current.get(id)
      if (!entry) continue
      const { error } = await supabase
        .from('fruit_log')
        .upsert(entryToRow(entry, user.id), { onConflict: 'user_id,taxon_id' })
      if (error) remaining.push(id)
    }
    saveQueue(scope, remaining)
    setPending(remaining.length)
    setSyncing(false)
  }, [scope, user])

  // ログイン時：Supabase から取り込み（ラストライトウィンでマージ）＋キュー flush。
  useEffect(() => {
    if (!supabase || !user) return
    let cancelled = false
    ;(async () => {
      setSyncing(true)
      const { data, error } = await supabase
        .from('fruit_log')
        .select('*')
        .eq('user_id', user.id)
      if (!cancelled && !error && data) {
        const merged = new Map(logRef.current)
        for (const row of data as SupabaseRow[]) {
          const remote = rowToEntry(row)
          const localE = merged.get(remote.taxonId)
          if (!localE || remote.updatedAt >= localE.updatedAt) {
            merged.set(remote.taxonId, remote)
          }
        }
        persist(merged)
      }
      setSyncing(false)
      await flushQueue()
    })()
    return () => {
      cancelled = true
    }
  }, [user, persist, flushQueue])

  // オンライン復帰でキューを流す（§11）。
  useEffect(() => {
    const onOnline = () => void flushQueue()
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [flushQueue])

  const pushRemote = useCallback(
    async (entry: FruitLogEntry) => {
      if (!supabase || !user) return
      const { error } = await supabase
        .from('fruit_log')
        .upsert(entryToRow(entry, user.id), { onConflict: 'user_id,taxon_id' })
      if (error) {
        const q = loadQueue(scope)
        q.push(entry.taxonId)
        saveQueue(scope, q)
        setPending(q.length)
      }
    },
    [scope, user],
  )

  const save = useCallback<LogState['save']>(
    (taxonId, patch) => {
      const prev = logRef.current.get(taxonId)
      const entry: FruitLogEntry = {
        taxonId,
        tried: patch.tried ?? prev?.tried ?? true,
        rating: patch.rating ?? prev?.rating ?? null,
        notes: patch.notes ?? prev?.notes ?? null,
        place: patch.place ?? prev?.place ?? null,
        triedDate: patch.triedDate ?? prev?.triedDate ?? null,
        updatedAt: nowIso(),
      }
      const next = new Map(logRef.current)
      next.set(taxonId, entry)
      persist(next)
      void pushRemote(entry)
    },
    [persist, pushRemote],
  )

  const remove = useCallback<LogState['remove']>(
    (taxonId) => {
      const next = new Map(logRef.current)
      next.delete(taxonId)
      persist(next)
      if (supabase && user) {
        void supabase
          .from('fruit_log')
          .delete()
          .eq('user_id', user.id)
          .eq('taxon_id', taxonId)
      }
    },
    [persist, user],
  )

  const value = useMemo<LogState>(() => {
    const canEdit = isSupabaseConfigured ? !!user : true
    return {
      log,
      canEdit,
      blockReason: canEdit ? null : 'login',
      localOnly: !isSupabaseConfigured,
      pending,
      syncing,
      hydrated,
      get: (id) => log.get(id),
      save,
      remove,
    }
  }, [log, user, pending, syncing, hydrated, save, remove])

  return <LogContext.Provider value={value}>{children}</LogContext.Provider>
}

export function useLog(): LogState {
  const ctx = useContext(LogContext)
  if (!ctx) throw new Error('useLog must be used within LogProvider')
  return ctx
}
