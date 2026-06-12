import { describe, expect, it } from 'vitest'
import { buildTaxonTree, speciesUnder } from '../tree'
import { baseSpecies, pineapple } from './fixtures'

describe('buildTaxonTree — ルート/プルーニング (§5.4 / §14)', () => {
  it('採用集合 {黄金果,柿,ライチ,...} の LCA は綱(Magnoliopsida)', () => {
    const tree = buildTaxonTree(baseSpecies)
    expect(tree.rootId).toBe('magnoliopsida')
    expect(tree.nodes['magnoliopsida'].parentId).toBeNull()
  })

  it('採用種の祖先でないノードは含まれない（界・門はLCAの上なので除外）', () => {
    const tree = buildTaxonTree(baseSpecies)
    expect(tree.nodes['plantae']).toBeUndefined()
    expect(tree.nodes['tracheophyta']).toBeUndefined()
    // ツツジ目・ムクロジ目・各科は含まれる
    expect(tree.nodes['ericales']).toBeDefined()
    expect(tree.nodes['sapindales']).toBeDefined()
    expect(tree.nodes['sapotaceae']).toBeDefined()
    expect(tree.nodes['ebenaceae']).toBeDefined()
  })

  it('祖先外の種を追加するとルートが上方に移動する（純関数性）', () => {
    const tree = buildTaxonTree([...baseSpecies, pineapple])
    // パイナップルは単子葉。綱が割れるので LCA は門(Tracheophyta)へ上昇。
    expect(tree.rootId).toBe('tracheophyta')
    expect(tree.nodes['tracheophyta'].parentId).toBeNull()
    expect(tree.nodes['magnoliopsida'].parentId).toBe('tracheophyta')
    expect(tree.nodes['liliopsida']).toBeDefined()
  })

  it('parent/children/lineage が整合する', () => {
    const tree = buildTaxonTree(baseSpecies)
    const abiu = tree.nodes['pouteria-caimito']
    expect(abiu.parentId).toBe('pouteria')
    expect(abiu.lineage).toEqual([
      'magnoliopsida',
      'ericales',
      'sapotaceae',
      'pouteria',
    ])
    expect(tree.nodes['pouteria'].childrenIds).toContain('pouteria-caimito')
    expect(tree.nodes['sapotaceae'].childrenIds).toContain('pouteria')
  })

  it('ancestors はランク→ID（フルチェーン、欠落キー省略 / §5.1）', () => {
    const tree = buildTaxonTree(baseSpecies)
    expect(tree.nodes['pouteria-caimito'].ancestors).toEqual({
      KINGDOM: 'plantae',
      PHYLUM: 'tracheophyta',
      CLASS: 'magnoliopsida',
      ORDER: 'ericales',
      FAMILY: 'sapotaceae',
      GENUS: 'pouteria',
    })
  })

  it('speciesCountUnder が配下の採用種数になる', () => {
    const tree = buildTaxonTree(baseSpecies)
    expect(tree.nodes['sapotaceae'].speciesCountUnder).toBe(3) // 黄金果,カニステル,サポジラ
    expect(tree.nodes['ericales'].speciesCountUnder).toBe(4) // +柿
    expect(tree.nodes['pouteria'].speciesCountUnder).toBe(2)
  })

  it('speciesUnder が葉を列挙する', () => {
    const tree = buildTaxonTree(baseSpecies)
    expect(speciesUnder(tree, 'sapotaceae').sort()).toEqual(
      ['manilkara-zapota', 'pouteria-caimito', 'pouteria-campechiana'].sort(),
    )
    expect(speciesUnder(tree, 'diospyros-kaki')).toEqual(['diospyros-kaki'])
  })

  it('representativeSpeciesIds が内部ノードに入る', () => {
    const tree = buildTaxonTree(baseSpecies)
    expect(tree.nodes['sapotaceae'].representativeSpeciesIds.length).toBeGreaterThan(0)
    expect(tree.nodes['sapotaceae'].representativeSpeciesIds).toContain(
      'pouteria-caimito',
    )
  })
})
