import type { FruitLog, TaxonNode, TaxonTree } from './types'
import { speciesUnder } from './tree'

export interface PreviewItem {
  node: TaxonNode
  tried: boolean
}

/**
 * 果物プレビューの代表種選定（§5.6）。
 * 食べた種を最優先（評価desc→日付desc）、枠が余れば未食代表で埋める。
 */
export function representativePreview(
  tree: TaxonTree,
  node: TaxonNode,
  log: FruitLog,
  k = 4,
): PreviewItem[] {
  const underIds = speciesUnder(tree, node.id)
  const underSet = new Set(underIds)

  // 食べた種：あなたのアンカー優先（評価desc, 食べた日desc）。
  const eaten = underIds
    .map((id) => log.get(id))
    .filter((e): e is NonNullable<typeof e> => !!e && e.tried)
    .sort((a, b) => {
      const ra = a.rating ?? -1
      const rb = b.rating ?? -1
      if (ra !== rb) return rb - ra
      const da = a.triedDate ?? ''
      const db = b.triedDate ?? ''
      return db.localeCompare(da)
    })
    .map((e) => e.taxonId)

  const eatenSet = new Set(eaten)

  // 未食代表（ビルド時のキュレート順を維持、食べた種は除外）。
  const reps = node.representativeSpeciesIds.filter(
    (id) => underSet.has(id) && !eatenSet.has(id),
  )

  const pickedIds = [...eaten, ...reps].slice(0, k)
  return pickedIds.map((id) => ({
    node: tree.nodes[id],
    tried: eatenSet.has(id),
  }))
}
