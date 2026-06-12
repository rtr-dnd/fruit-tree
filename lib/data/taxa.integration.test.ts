import { describe, expect, it } from 'vitest'
import type { TaxonTree } from '../core/types'
import { sharedLowestRank } from '../core/closeness'
import { buildRelationshipList } from '../core/relationships'
import { buildSearchIndex, search } from '../core/search'
import taxaJson from './taxa.json'

// 実データ（パイプライン出力）に対する受け入れ基準（§14）の回帰テスト。
const tree = taxaJson as unknown as TaxonTree

describe('実 taxa.json での受け入れ基準（§14）', () => {
  it('黄金果・柿・ライチが収録されている', () => {
    expect(tree.nodes['pouteria-caimito']).toBeDefined()
    expect(tree.nodes['diospyros-kaki']).toBeDefined()
    expect(tree.nodes['litchi-chinensis']).toBeDefined()
  })

  it('近さ：黄金果↔柿=ORDER、黄金果↔ライチ=FAR', () => {
    const abiu = tree.nodes['pouteria-caimito']
    expect(sharedLowestRank(abiu, tree.nodes['diospyros-kaki'])).toBe('ORDER')
    expect(sharedLowestRank(abiu, tree.nodes['litchi-chinensis'])).toBe('FAR')
  })

  it('黄金果の関係リストに「カキノキ科 → 柿」が出て、ライチは出ない', () => {
    const rel = buildRelationshipList('pouteria-caimito', tree, new Map())
    const order = rel.sections.find((s) => s.bucket === 'ORDER')!
    const ebenaceae = order.groups.find((g) => g.id === 'ebenaceae')
    expect(ebenaceae).toBeDefined()
    expect(ebenaceae!.items.map((i) => i.node.id)).toContain('diospyros-kaki')

    const allIds = rel.sections.flatMap((s) =>
      s.groups.flatMap((g) => g.items.map((i) => i.node.id)),
    )
    expect(allIds).not.toContain('litchi-chinensis')
  })

  it('同じ科の別の属に他の Sapotaceae が並ぶ', () => {
    const rel = buildRelationshipList('pouteria-caimito', tree, new Map())
    const family = rel.sections.find((s) => s.bucket === 'FAMILY')!
    const ids = family.groups.flatMap((g) => g.items.map((i) => i.node.id))
    expect(ids).toContain('manilkara-zapota')
  })

  it('検索：和名・学名で引ける', () => {
    const index = buildSearchIndex(tree)
    expect(search('らいち', index).map((r) => r.node.id)).toContain(
      'litchi-chinensis',
    )
    expect(search('Pouteria', index).length).toBeGreaterThan(0)
  })
})
