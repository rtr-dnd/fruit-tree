import Fuse from 'fuse.js'
import { nodeLabel } from './tree'
import type { TaxonNode, TaxonTree } from './types'

/** カタカナ→ひらがな（U+30A1–U+30F6）。 */
function katakanaToHiragana(s: string): string {
  return s.replace(/[ァ-ヶ]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60),
  )
}

/** 正規化（NFKC + 小文字化 + かな畳み込み + trim）（§5.7）。 */
export function normalize(s: string): string {
  return katakanaToHiragana(s.normalize('NFKC').toLowerCase()).trim()
}

interface IndexRecord {
  id: string
  node: TaxonNode
  isSpecies: boolean
  ja: string
  en: string
  sci: string
  nJa: string
  nEn: string
  nSci: string
  nAliases: string[]
  nLabel: string
}

export interface SearchIndex {
  records: IndexRecord[]
  fuse: Fuse<IndexRecord>
}

/** 全ノード（SPECIES＋内部）から検索インデックスを生成（§5.7）。 */
export function buildSearchIndex(tree: TaxonTree): SearchIndex {
  const records: IndexRecord[] = Object.values(tree.nodes).map((node) => {
    const ja = node.names.ja ?? ''
    const en = node.names.en ?? ''
    const sci = node.scientificName ?? ''
    return {
      id: node.id,
      node,
      isSpecies: node.rank === 'SPECIES',
      ja,
      en,
      sci,
      nJa: normalize(ja),
      nEn: normalize(en),
      nSci: normalize(sci),
      nAliases: (node.searchAliases ?? []).map(normalize),
      nLabel: normalize(nodeLabel(node)),
    }
  })

  const fuse = new Fuse(records, {
    keys: ['nJa', 'nEn', 'nSci', 'nAliases'],
    threshold: 0.35,
    ignoreLocation: true,
    minMatchCharLength: 2,
    includeScore: true,
  })

  return { records, fuse }
}

export interface SearchResult {
  node: TaxonNode
  /** 'prefix' のほうが 'fuzzy' より上位（§5.7）。 */
  matchType: 'prefix' | 'fuzzy'
}

/**
 * 検索（§5.7）。前方一致 ＞ あいまい一致。
 * 同点は SPECIES を内部ノードより上、次に和名昇順。重複は id で排除。
 */
export function search(
  query: string,
  index: SearchIndex,
  limit = 50,
): SearchResult[] {
  const q = normalize(query)
  if (q.length === 0) return []

  const seen = new Set<string>()
  const results: SearchResult[] = []

  // 1. 前方一致
  const prefixHits = index.records.filter(
    (r) =>
      r.nJa.startsWith(q) ||
      r.nEn.startsWith(q) ||
      r.nSci.startsWith(q) ||
      r.nAliases.some((a) => a.startsWith(q)),
  )
  prefixHits.sort(tieBreak)
  for (const r of prefixHits) {
    if (seen.has(r.id)) continue
    seen.add(r.id)
    results.push({ node: r.node, matchType: 'prefix' })
  }

  // 2. あいまい一致（Fuse）
  if (q.length >= 2) {
    const fuzzy = index.fuse.search(q)
    for (const { item } of fuzzy) {
      if (seen.has(item.id)) continue
      seen.add(item.id)
      results.push({ node: item.node, matchType: 'fuzzy' })
    }
  }

  return results.slice(0, limit)
}

function tieBreak(a: IndexRecord, b: IndexRecord): number {
  if (a.isSpecies !== b.isSpecies) return a.isSpecies ? -1 : 1
  return a.nLabel.localeCompare(b.nLabel, 'ja')
}
