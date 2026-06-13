import { describe, expect, it } from 'vitest'
import { sharedLowestRank } from '@/lib/core'
import { buildRelationshipList } from '@/lib/core'
import { search } from '@/lib/core'
import {
  bundledCatalog,
  buildCatalogTree,
  defaultCatalogTree,
  type CatalogEntry,
} from './catalog'

const { tree, searchIndex } = defaultCatalogTree

describe('同梱スナップショットのカタログ（受け入れ基準 §14）', () => {
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
    expect(ebenaceae?.items.map((i) => i.node.id)).toContain('diospyros-kaki')
    const allIds = rel.sections.flatMap((s) =>
      s.groups.flatMap((g) => g.items.map((i) => i.node.id)),
    )
    expect(allIds).not.toContain('litchi-chinensis')
  })

  it('検索：別名「らいち」でもライチが引ける', () => {
    expect(search('らいち', searchIndex).map((r) => r.node.id)).toContain(
      'litchi-chinensis',
    )
  })

  it('種に追加日・追加順が付く', () => {
    const abiu = tree.nodes['pouteria-caimito']
    expect(abiu.addedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(typeof abiu.addedSeq).toBe('number')
  })
})

describe('buildCatalogTree（追加・マージ）', () => {
  const pondApple: CatalogEntry = {
    id: 'annona-glabra',
    createdAt: '2099-01-01T00:00:00.000Z',
    resolved: {
      id: 'annona-glabra',
      scientificName: 'Annona glabra',
      names: { ja: 'ポンドアップル', en: 'Pond apple' },
      classification: [
        { rank: 'KINGDOM', id: 'plantae', scientificName: 'Plantae', names: {} },
        { rank: 'PHYLUM', id: 'tracheophyta', scientificName: 'Tracheophyta', names: {} },
        { rank: 'CLASS', id: 'magnoliopsida', scientificName: 'Magnoliopsida', names: {} },
        { rank: 'ORDER', id: 'magnoliales', scientificName: 'Magnoliales', names: {} },
        { rank: 'FAMILY', id: 'annonaceae', scientificName: 'Annonaceae', names: {} },
        { rank: 'GENUS', id: 'annona', scientificName: 'Annona', names: {} },
      ],
    },
  }

  it('カタログに足すとツリーに出現し、Annona 属にぶら下がる', () => {
    const { tree: merged } = buildCatalogTree([...bundledCatalog, pondApple])
    expect(merged.nodes['annona-glabra']).toBeDefined()
    expect(merged.nodes['annona'].childrenIds).toContain('annona-glabra')
  })

  it('最後に足したものが最大の追加順になる', () => {
    const { tree: merged } = buildCatalogTree([...bundledCatalog, pondApple])
    const max = Math.max(
      ...Object.values(merged.nodes)
        .filter((n) => n.rank === 'SPECIES')
        .map((n) => n.addedSeq ?? 0),
    )
    expect(merged.nodes['annona-glabra'].addedSeq).toBe(max)
  })

  it('空なら空ツリー', () => {
    expect(buildCatalogTree([]).tree.rootId).toBe('')
  })
})
