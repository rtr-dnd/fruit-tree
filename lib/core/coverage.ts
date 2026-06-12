import type { FruitLog, TaxonNode, TaxonTree } from './types'
import { speciesUnder } from './tree'

/** 配下で「食べた」種の数（§5.5）。 */
export function triedSpeciesUnder(
  tree: TaxonTree,
  node: TaxonNode,
  log: FruitLog,
): number {
  if (node.rank === 'SPECIES') {
    return log.get(node.id)?.tried ? 1 : 0
  }
  let count = 0
  for (const sid of speciesUnder(tree, node.id)) {
    if (log.get(sid)?.tried) count++
  }
  return count
}

/** 配下の採用種総数（内部ノードは事前計算値、葉は1）。 */
export function totalSpeciesUnder(node: TaxonNode): number {
  return node.rank === 'SPECIES' ? 1 : node.speciesCountUnder
}

export interface Coverage {
  tried: number
  total: number
  /** 0〜1。total=0 のとき 0。 */
  ratio: number
}

/** 制覇率（§5.5）。 */
export function coverage(
  tree: TaxonTree,
  node: TaxonNode,
  log: FruitLog,
): Coverage {
  const tried = triedSpeciesUnder(tree, node, log)
  const total = totalSpeciesUnder(node)
  return { tried, total, ratio: total === 0 ? 0 : tried / total }
}

/** 未踏判定：配下に「食べた」種が1つもない（§5.5）。 */
export function untrodden(
  tree: TaxonTree,
  node: TaxonNode,
  log: FruitLog,
): boolean {
  return triedSpeciesUnder(tree, node, log) === 0
}
