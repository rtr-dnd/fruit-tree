import type { Rank, TaxonNode } from './types'

/** 「より遠い仲間」を表す番兵（目より上でしか一致しない）。 */
export const FAR = 'FAR' as const
export type SharedRank = Rank | typeof FAR

// 下位→上位（§5.2）。
export const RANK_ORDER: Rank[] = [
  'SPECIES',
  'GENUS',
  'FAMILY',
  'ORDER',
  'CLASS',
  'PHYLUM',
]

// 「近さ」として意味を持つのは目(ORDER)まで。綱/門以上の共有は「遠い」(FAR)とする。
// （§14: sharedLowestRank(黄金果, ライチ) → FAR。両者は同じ綱 Magnoliopsida だが目が異なる。）
const CLOSENESS_RANKS: Rank[] = ['GENUS', 'FAMILY', 'ORDER']

/**
 * 2つの SPECIES ノードが共有する最下位ランク（§5.2）。
 * 位置ではなく必ずランク名をキーに比較する（§5.1）。
 * 目より上（綱/門）でしか一致しない場合は FAR。
 */
export function sharedLowestRank(a: TaxonNode, b: TaxonNode): SharedRank {
  if (a.id === b.id) return 'SPECIES'
  for (const rank of CLOSENESS_RANKS) {
    // GENUS → FAMILY → ORDER の順に下から確認
    const ka = a.ancestors[rank]
    const kb = b.ancestors[rank]
    if (ka != null && kb != null && ka === kb) return rank
  }
  return FAR
}

/** 共有ランク → 近さラベル（§2.1 / §5.2）。 */
export function closenessLabel(rank: SharedRank): string {
  switch (rank) {
    case 'SPECIES':
      return '最も近い（品種違い）'
    case 'GENUS':
      return '近い（同属）'
    case 'FAMILY':
      return 'やや近い（同科）'
    case 'ORDER':
      return '中くらい（隣の枝・同目）'
    default:
      return '遠い'
  }
}
