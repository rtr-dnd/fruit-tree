import { describe, expect, it } from 'vitest'
import { buildTaxonTree } from '../tree'
import { closenessLabel, sharedLowestRank } from '../closeness'
import { baseSpecies, pineapple } from './fixtures'

const tree = buildTaxonTree(baseSpecies)
const abiu = tree.nodes['pouteria-caimito']
const kaki = tree.nodes['diospyros-kaki']
const litchi = tree.nodes['litchi-chinensis']
const canistel = tree.nodes['pouteria-campechiana']
const sapodilla = tree.nodes['manilkara-zapota']

describe('sharedLowestRank (§5.2 / §14 近さ判定)', () => {
  it('黄金果 と 柿 は同じツツジ目 → ORDER', () => {
    expect(sharedLowestRank(abiu, kaki)).toBe('ORDER')
    expect(closenessLabel(sharedLowestRank(abiu, kaki))).toBe(
      '中くらい（隣の枝・同目）',
    )
  })

  it('黄金果 と ライチ は目が異なる → FAR', () => {
    expect(sharedLowestRank(abiu, litchi)).toBe('FAR')
    expect(closenessLabel(sharedLowestRank(abiu, litchi))).toBe('遠い')
  })

  it('黄金果 と カニステル は同属 → GENUS', () => {
    expect(sharedLowestRank(abiu, canistel)).toBe('GENUS')
    expect(closenessLabel(sharedLowestRank(abiu, canistel))).toBe('近い（同属）')
  })

  it('黄金果 と サポジラ は同科の別属 → FAMILY', () => {
    expect(sharedLowestRank(abiu, sapodilla)).toBe('FAMILY')
    expect(closenessLabel(sharedLowestRank(abiu, sapodilla))).toBe(
      'やや近い（同科）',
    )
  })

  it('自分自身 → SPECIES', () => {
    expect(sharedLowestRank(abiu, abiu)).toBe('SPECIES')
  })

  it('ランクは位置ではなくキーで比較する（§5.1）', () => {
    // パイナップルは綱が異なる。黄金果とは綱(CLASS)も共有しないので FAR。
    const tree2 = buildTaxonTree([...baseSpecies, pineapple])
    const a = tree2.nodes['pouteria-caimito']
    const p = tree2.nodes['ananas-comosus']
    expect(sharedLowestRank(a, p)).toBe('FAR')
  })
})
