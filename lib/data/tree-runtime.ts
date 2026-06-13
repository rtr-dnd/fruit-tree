import {
  buildSearchIndex,
  buildTaxonTree,
  type ResolvedSpecies,
  type SearchIndex,
  type TaxonTree,
} from '@/lib/core'
import baseResolvedJson from './resolved.json'
import { searchIndex as baseSearchIndex, tree as baseTree } from './taxa'

const baseResolved = baseResolvedJson as unknown as ResolvedSpecies[]

/** アプリ内追加（共有カタログ）の1件。 */
export interface SupplementalEntry {
  gbifUsageKey: number
  resolved: ResolvedSpecies
  createdBy?: string | null
  /** ISO タイムスタンプ。 */
  createdAt: string
}

export interface AssembledTree {
  tree: TaxonTree
  searchIndex: SearchIndex
}

const baseMaxSeq = Object.values(baseTree.nodes).reduce(
  (m, n) => (n.rank === 'SPECIES' ? Math.max(m, n.addedSeq ?? 0) : m),
  0,
)

const baseAssembled: AssembledTree = {
  tree: baseTree,
  searchIndex: baseSearchIndex,
}

/**
 * バンドル済みの種＋アプリ内追加（supplemental）をマージして分類ツリーを再構築（§7.4 モデルB）。
 * 純関数 buildTaxonTree の seam を使うだけ。ルート(LCA)・関係リストは自動で追従。
 * supplemental が空なら、ビルド済みツリーをそのまま返す（コストゼロ）。
 */
export function assembleTree(supplemental: SupplementalEntry[]): AssembledTree {
  // 既にバンドル済みの種と重複するものは除外（同一 id）。
  const baseIds = new Set(Object.keys(baseTree.nodes))
  const extra = supplemental.filter((s) => !baseIds.has(s.resolved.id))
  if (extra.length === 0) return baseAssembled

  const tree = buildTaxonTree([...baseResolved, ...extra.map((s) => s.resolved)])

  // 追加日・追加順を付与：既存種はバンドルの値を踏襲、追加分は created_at＋最新連番。
  const sortedExtra = [...extra].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  )
  const extraStamp = new Map<string, { date: string; seq: number }>()
  sortedExtra.forEach((s, i) =>
    extraStamp.set(s.resolved.id, {
      date: s.createdAt.slice(0, 10),
      seq: baseMaxSeq + 1 + i,
    }),
  )

  for (const node of Object.values(tree.nodes)) {
    if (node.rank !== 'SPECIES') continue
    const baseNode = baseTree.nodes[node.id]
    if (baseNode?.addedAt) {
      node.addedAt = baseNode.addedAt
      node.addedSeq = baseNode.addedSeq
    } else {
      const e = extraStamp.get(node.id)
      if (e) {
        node.addedAt = e.date
        node.addedSeq = e.seq
      }
    }
  }

  return { tree, searchIndex: buildSearchIndex(tree) }
}
