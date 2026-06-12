import { describe, expect, it } from 'vitest'
import { buildTaxonTree } from '../tree'
import { buildRelationshipList } from '../relationships'
import { baseSpecies, makeLog } from './fixtures'

const tree = buildTaxonTree(baseSpecies)

describe('buildRelationshipList — 黄金果の詳細 (§5.3 / §14)', () => {
  it('同じ科の別の属に他の Sapotaceae が属見出しで並ぶ', () => {
    const rel = buildRelationshipList('pouteria-caimito', tree, makeLog([]))
    const family = rel.sections.find((s) => s.bucket === 'FAMILY')
    expect(family).toBeDefined()
    expect(family!.label).toBe('同じ科の別の属')
    expect(family!.grouped).toBe(true)
    // サポジラ(マニルカラ属)が見出しグループに入る
    const headings = family!.groups.map((g) => g.headingLabel)
    expect(headings).toContain('マニルカラ属')
    const manilkara = family!.groups.find((g) => g.id === 'manilkara')
    expect(manilkara!.items.map((i) => i.node.id)).toContain('manilkara-zapota')
  })

  it('同じ属の仲間にカニステルが出る', () => {
    const rel = buildRelationshipList('pouteria-caimito', tree, makeLog([]))
    const genus = rel.sections.find((s) => s.bucket === 'GENUS')
    expect(genus).toBeDefined()
    expect(genus!.label).toBe('同じ属の仲間')
    const ids = genus!.groups.flatMap((g) => g.items.map((i) => i.node.id))
    expect(ids).toContain('pouteria-campechiana')
  })

  it('同じ目の別の科に「カキノキ科 → 柿」が出現する（柿はここ）', () => {
    const rel = buildRelationshipList('pouteria-caimito', tree, makeLog([]))
    const order = rel.sections.find((s) => s.bucket === 'ORDER')
    expect(order).toBeDefined()
    expect(order!.label).toBe('同じ目の別の科')
    const ebenaceae = order!.groups.find((g) => g.id === 'ebenaceae')
    expect(ebenaceae).toBeDefined()
    expect(ebenaceae!.headingLabel).toBe('カキノキ科')
    expect(ebenaceae!.items.map((i) => i.node.id)).toContain('diospyros-kaki')
  })

  it('ライチはいずれのセクションにも現れない（目が異なる）', () => {
    const rel = buildRelationshipList('pouteria-caimito', tree, makeLog([]))
    const allIds = rel.sections.flatMap((s) =>
      s.groups.flatMap((g) => g.items.map((i) => i.node.id)),
    )
    expect(allIds).not.toContain('litchi-chinensis')
    expect(rel.furtherCount).toBeGreaterThanOrEqual(1)
  })

  it('一度も食べていない近縁グループに untrodden=true が立つ', () => {
    const rel = buildRelationshipList('pouteria-caimito', tree, makeLog([]))
    const order = rel.sections.find((s) => s.bucket === 'ORDER')!
    const ebenaceae = order.groups.find((g) => g.id === 'ebenaceae')!
    expect(ebenaceae.untrodden).toBe(true)
  })

  it('柿を食べると カキノキ科グループの untrodden が下りる', () => {
    const rel = buildRelationshipList(
      'pouteria-caimito',
      tree,
      makeLog([{ taxonId: 'diospyros-kaki' }]),
    )
    const order = rel.sections.find((s) => s.bucket === 'ORDER')!
    const ebenaceae = order.groups.find((g) => g.id === 'ebenaceae')!
    expect(ebenaceae.untrodden).toBe(false)
    expect(ebenaceae.triedCount).toBe(1)
    expect(ebenaceae.items.find((i) => i.node.id === 'diospyros-kaki')!.tried).toBe(
      true,
    )
  })

  it('グループ内・グループ間とも未踏が上にソートされる', () => {
    // サポジラだけ食べた状態：同科の別の属で マニルカラ属(食済) が下に来る
    const rel = buildRelationshipList(
      'pouteria-caimito',
      tree,
      makeLog([{ taxonId: 'manilkara-zapota' }]),
    )
    const family = rel.sections.find((s) => s.bucket === 'FAMILY')!
    const lastGroup = family.groups[family.groups.length - 1]
    expect(lastGroup.untrodden).toBe(false)
  })
})
