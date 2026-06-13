import { describe, expect, it } from 'vitest'
import { assembleTree, type SupplementalEntry } from './tree-runtime'
import { tree as baseTree } from './taxa'
import type { ResolvedSpecies } from '@/lib/core'

const baseSpeciesCount = Object.values(baseTree.nodes).filter(
  (n) => n.rank === 'SPECIES',
).length

// 既存のバンレイシ科 Annona 属に差し込む新種（ポンドアップル）。
const pondApple: ResolvedSpecies = {
  id: 'annona-glabra',
  scientificName: 'Annona glabra',
  names: { ja: 'ポンドアップル', en: 'Pond apple' },
  imageUrl: null,
  classification: [
    { rank: 'KINGDOM', id: 'plantae', scientificName: 'Plantae', names: {} },
    { rank: 'PHYLUM', id: 'tracheophyta', scientificName: 'Tracheophyta', names: {} },
    { rank: 'CLASS', id: 'magnoliopsida', scientificName: 'Magnoliopsida', names: {} },
    { rank: 'ORDER', id: 'magnoliales', scientificName: 'Magnoliales', names: { ja: 'モクレン目' } },
    { rank: 'FAMILY', id: 'annonaceae', scientificName: 'Annonaceae', names: { ja: 'バンレイシ科' } },
    { rank: 'GENUS', id: 'annona', scientificName: 'Annona', names: { ja: 'バンレイシ属' } },
  ],
}

const entry: SupplementalEntry = {
  gbifUsageKey: 9999999,
  resolved: pondApple,
  createdAt: '2026-06-13T00:00:00.000Z',
}

describe('assembleTree（アプリ内追加のマージ / §7.4 モデルB）', () => {
  it('supplemental が空ならバンドル済みツリーをそのまま返す', () => {
    const { tree } = assembleTree([])
    expect(tree).toBe(baseTree)
  })

  it('追加種がツリーに出現し、既存種も保持される', () => {
    const { tree } = assembleTree([entry])
    expect(tree.nodes['annona-glabra']).toBeDefined()
    expect(tree.nodes['annona-glabra'].rank).toBe('SPECIES')
    // 既存の Annona 属の下にぶら下がる
    expect(tree.nodes['annona'].childrenIds).toContain('annona-glabra')
    expect(tree.nodes['annona-muricata']).toBeDefined()
    const count = Object.values(tree.nodes).filter((n) => n.rank === 'SPECIES').length
    expect(count).toBe(baseSpeciesCount + 1)
  })

  it('追加種に追加日と最新の連番が付く', () => {
    const { tree } = assembleTree([entry])
    const node = tree.nodes['annona-glabra']
    expect(node.addedAt).toBe('2026-06-13')
    const baseMax = Math.max(
      ...Object.values(baseTree.nodes)
        .filter((n) => n.rank === 'SPECIES')
        .map((n) => n.addedSeq ?? 0),
    )
    expect(node.addedSeq).toBeGreaterThan(baseMax)
  })

  it('既存種と重複する追加は無視される', () => {
    const dup: SupplementalEntry = {
      gbifUsageKey: 1,
      resolved: { ...pondApple, id: 'annona-muricata' },
      createdAt: '2026-06-13T00:00:00.000Z',
    }
    const { tree } = assembleTree([dup])
    expect(tree).toBe(baseTree)
  })

  it('検索インデックスにも追加種が載る', () => {
    const { searchIndex } = assembleTree([entry])
    expect(searchIndex.records.some((r) => r.id === 'annona-glabra')).toBe(true)
  })
})
