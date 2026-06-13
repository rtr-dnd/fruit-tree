import type { FruitLog, FruitLogEntry, TaxonNode, TaxonTree } from './types'
import { speciesUnder } from './tree'

/** 記録の「食べた形態」。form 無しの旧データは生(raw)扱い。 */
function formOf(entry: FruitLogEntry | undefined): 'raw' | 'processed' | null {
  if (!entry?.tried) return null
  return entry.form === 'processed' ? 'processed' : 'raw'
}

/** 配下で「食べた」種の数（生・加工いずれか / §5.5）。 */
export function triedSpeciesUnder(
  tree: TaxonTree,
  node: TaxonNode,
  log: FruitLog,
): number {
  const ids = node.rank === 'SPECIES' ? [node.id] : speciesUnder(tree, node.id)
  return ids.reduce((c, id) => (log.get(id)?.tried ? c + 1 : c), 0)
}

/** 配下の採用種総数（内部ノードは事前計算値、葉は1）。 */
export function totalSpeciesUnder(node: TaxonNode): number {
  return node.rank === 'SPECIES' ? 1 : node.speciesCountUnder
}

export interface Coverage {
  /** 生で食べた種数。 */
  raw: number
  /** 加工品のみ食べた種数。 */
  processed: number
  /** 生・加工いずれかを食べた種数（raw + processed）。 */
  any: number
  total: number
  /** 0〜1。生で食べた割合（raw/total）。 */
  ratio: number
}

/** 制覇率（生・加工を分けて集計 / §5.5）。 */
export function coverage(
  tree: TaxonTree,
  node: TaxonNode,
  log: FruitLog,
): Coverage {
  const ids = node.rank === 'SPECIES' ? [node.id] : speciesUnder(tree, node.id)
  let raw = 0
  let processed = 0
  for (const id of ids) {
    const f = formOf(log.get(id))
    if (f === 'raw') raw++
    else if (f === 'processed') processed++
  }
  const total = totalSpeciesUnder(node)
  return {
    raw,
    processed,
    any: raw + processed,
    total,
    ratio: total === 0 ? 0 : raw / total,
  }
}

/** 未踏判定：配下に「食べた」種が1つもない（生・加工とも / §5.5）。 */
export function untrodden(
  tree: TaxonTree,
  node: TaxonNode,
  log: FruitLog,
): boolean {
  return triedSpeciesUnder(tree, node, log) === 0
}
