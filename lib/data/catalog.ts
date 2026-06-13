import {
  buildSearchIndex,
  buildTaxonTree,
  type ResolvedSpecies,
  type SearchIndex,
  type TaxonNode,
  type TaxonTree,
} from '@/lib/core'
import snapshotJson from './snapshot.json'

/** カタログ1件（種＝フルーツ）。 */
export interface CatalogEntry {
  id: string
  resolved: ResolvedSpecies
  /** ISO タイムスタンプ。追加順・追加日の基準。 */
  createdAt: string
}

/** アプリ同梱スナップショット（起動時の即時描画＋オフライン用ベースライン）。 */
export const bundledCatalog = snapshotJson as unknown as CatalogEntry[]

export interface BuiltTree {
  tree: TaxonTree
  searchIndex: SearchIndex
}

const EMPTY: BuiltTree = {
  tree: { rootId: '', nodes: {} },
  searchIndex: buildSearchIndex({ rootId: '', nodes: {} }),
}

/**
 * カタログ（種の集合）→ 分類ツリー＋検索インデックス。
 * 純関数 buildTaxonTree（LCA＋プルーニング）で組み、createdAt 順に追加日・追加順を付与する。
 */
export function buildCatalogTree(entries: CatalogEntry[]): BuiltTree {
  const byId = new Map<string, CatalogEntry>()
  for (const e of entries) byId.set(e.id, e)
  const list = [...byId.values()]
  if (list.length === 0) return EMPTY

  const tree = buildTaxonTree(list.map((e) => e.resolved))

  const ordered = [...list].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  const stamp = new Map<string, { date: string; seq: number }>()
  ordered.forEach((e, i) => stamp.set(e.id, { date: e.createdAt.slice(0, 10), seq: i + 1 }))
  for (const node of Object.values(tree.nodes)) {
    if (node.rank !== 'SPECIES') continue
    const s = stamp.get(node.id)
    if (s) {
      node.addedAt = s.date
      node.addedSeq = s.seq
    }
  }

  return { tree, searchIndex: buildSearchIndex(tree) }
}

/** 同梱スナップショットから組んだ既定ツリー（SSR・初期表示用）。 */
export const defaultCatalogTree = buildCatalogTree(bundledCatalog)

export function isSpecies(node: TaxonNode): boolean {
  return node.rank === 'SPECIES'
}
