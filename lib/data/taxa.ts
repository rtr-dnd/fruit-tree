import taxaJson from './taxa.json'
import type { TaxonNode, TaxonTree } from '../core'
import { buildSearchIndex } from '../core'

// ビルド時生成の静的分類ツリー（§6.1）。ナビゲーションは外部 fetch なし（§10）。
export const tree = taxaJson as unknown as TaxonTree
export const searchIndex = buildSearchIndex(tree)
export const ROOT_ID = tree.rootId

export function getNode(id: string): TaxonNode | undefined {
  return tree.nodes[id]
}

export function isSpecies(node: TaxonNode): boolean {
  return node.rank === 'SPECIES'
}

/** 全種ノード（統計用）。 */
export const allSpecies: TaxonNode[] = Object.values(tree.nodes).filter(
  (n) => n.rank === 'SPECIES',
)
