import { cachedGet } from '../lib/http'
import type { Rank } from '../../src/core/types'

export interface GbifAncestor {
  rank: Rank
  name: string
  key: number
}

export interface GbifMatch {
  usageKey: number
  scientificName: string
  canonicalName: string
  matchType: string
  confidence: number
  status: string
  rank: string
  /** KINGDOM→GENUS の順（種自身は含まない）。 */
  ancestors: GbifAncestor[]
}

// GBIF が返す各ランクのフィールド名。
const RANK_FIELDS: { rank: Rank; nameKey: string; keyKey: string }[] = [
  { rank: 'KINGDOM', nameKey: 'kingdom', keyKey: 'kingdomKey' },
  { rank: 'PHYLUM', nameKey: 'phylum', keyKey: 'phylumKey' },
  { rank: 'CLASS', nameKey: 'class', keyKey: 'classKey' },
  { rank: 'ORDER', nameKey: 'order', keyKey: 'orderKey' },
  { rank: 'FAMILY', nameKey: 'family', keyKey: 'familyKey' },
  { rank: 'GENUS', nameKey: 'genus', keyKey: 'genusKey' },
]

/**
 * GBIF /species/match で学名を解決し、usageKey＋界〜属の完全な上位分類を取得（§7.2）。
 * 表記ゆれ・シノニムはここで吸収。matchType/confidence をログ。
 */
export async function matchSpecies(name: string): Promise<GbifMatch | null> {
  const body = await cachedGet('https://api.gbif.org/v1/species/match', {
    params: { name, strict: 'false', verbose: 'false' },
    politeDelayMs: 200,
  })
  const data = JSON.parse(body) as Record<string, unknown>

  if (data.matchType === 'NONE' || data.usageKey == null) {
    return null
  }

  const ancestors: GbifAncestor[] = []
  for (const f of RANK_FIELDS) {
    const nm = data[f.nameKey]
    const key = data[f.keyKey]
    if (typeof nm === 'string' && typeof key === 'number') {
      ancestors.push({ rank: f.rank, name: nm, key })
    }
  }

  return {
    usageKey: data.usageKey as number,
    scientificName: (data.scientificName as string) ?? name,
    canonicalName: (data.canonicalName as string) ?? name,
    matchType: (data.matchType as string) ?? 'UNKNOWN',
    confidence: (data.confidence as number) ?? 0,
    status: (data.status as string) ?? 'UNKNOWN',
    rank: (data.rank as string) ?? 'UNKNOWN',
    ancestors,
  }
}
