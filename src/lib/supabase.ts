import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Supabase クライアント（§8）。環境変数が無ければ null（＝ローカル専用モード）。
 * 未設定でも閲覧・ローカル記録は完全に動作する（§10 オフライン閲覧）。
 */
export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null

export const isSupabaseConfigured = supabase !== null
