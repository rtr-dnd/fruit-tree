import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
// 新方式の publishable key（sb_publishable_…）優先。旧 anon key にもフォールバック。
const key =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/**
 * Supabase クライアント（§8）。環境変数が無ければ null（＝ローカル専用モード）。
 * 未設定でも閲覧・ローカル記録は完全に動作する（§10 オフライン閲覧）。
 */
export const supabase: SupabaseClient | null =
  url && key ? createClient(url, key) : null

export const isSupabaseConfigured = supabase !== null
