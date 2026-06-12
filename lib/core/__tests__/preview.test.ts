import { describe, expect, it } from 'vitest'
import { buildTaxonTree } from '../tree'
import { representativePreview } from '../preview'
import { baseSpecies, makeLog } from './fixtures'

const tree = buildTaxonTree(baseSpecies)

describe('representativePreview (§5.6 / §14)', () => {
  it('食べた種が先頭に来る（記憶のアンカー）', () => {
    const log = makeLog([{ taxonId: 'diospyros-kaki', rating: 5 }])
    const picks = representativePreview(tree, tree.nodes['ebenaceae'], log)
    expect(picks[0].node.id).toBe('diospyros-kaki')
    expect(picks[0].tried).toBe(true)
  })

  it('複数の食べた種は評価の高い順', () => {
    const log = makeLog([
      { taxonId: 'pouteria-caimito', rating: 3 },
      { taxonId: 'manilkara-zapota', rating: 5 },
    ])
    const picks = representativePreview(tree, tree.nodes['sapotaceae'], log, 4)
    expect(picks[0].node.id).toBe('manilkara-zapota')
    expect(picks[1].node.id).toBe('pouteria-caimito')
  })

  it('未踏ノードでも代表種で枠を埋める', () => {
    const picks = representativePreview(tree, tree.nodes['sapotaceae'], makeLog([]))
    expect(picks.length).toBeGreaterThan(0)
    expect(picks.every((p) => !p.tried)).toBe(true)
  })

  it('k 件を超えない', () => {
    const picks = representativePreview(tree, tree.nodes['magnoliopsida'], makeLog([]), 2)
    expect(picks.length).toBeLessThanOrEqual(2)
  })
})
