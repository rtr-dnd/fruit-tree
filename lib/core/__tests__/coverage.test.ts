import { describe, expect, it } from 'vitest'
import { buildTaxonTree } from '../tree'
import { coverage, totalSpeciesUnder, triedSpeciesUnder, untrodden } from '../coverage'
import { baseSpecies, makeLog } from './fixtures'

const tree = buildTaxonTree(baseSpecies)

describe('coverage / untrodden (§5.5 / §14)', () => {
  it('制覇率 = 生で食べた種数 / 総種数', () => {
    const log = makeLog([
      { taxonId: 'pouteria-caimito' },
      { taxonId: 'manilkara-zapota' },
    ])
    const cov = coverage(tree, tree.nodes['sapotaceae'], log)
    expect(cov.total).toBe(3)
    expect(cov.raw).toBe(2) // アカテツ科 2/3（生）
    expect(cov.any).toBe(2)
    expect(cov.ratio).toBeCloseTo(2 / 3)
  })

  it('生(raw)と加工品(processed)を分けて数える', () => {
    const log = makeLog([
      { taxonId: 'pouteria-caimito', form: 'raw' },
      { taxonId: 'manilkara-zapota', form: 'processed' },
    ])
    const cov = coverage(tree, tree.nodes['sapotaceae'], log)
    expect(cov.raw).toBe(1)
    expect(cov.processed).toBe(1)
    expect(cov.any).toBe(2)
    expect(cov.ratio).toBeCloseTo(1 / 3) // 比率は生のみ
  })

  it('form 無しの旧データは生(raw)扱い', () => {
    const log = makeLog([{ taxonId: 'pouteria-caimito' }])
    const cov = coverage(tree, tree.nodes['sapotaceae'], log)
    expect(cov.raw).toBe(1)
    expect(cov.processed).toBe(0)
  })

  it('triedSpeciesUnder / totalSpeciesUnder', () => {
    const log = makeLog([{ taxonId: 'diospyros-kaki' }])
    expect(triedSpeciesUnder(tree, tree.nodes['ericales'], log)).toBe(1)
    expect(totalSpeciesUnder(tree.nodes['ericales'])).toBe(4)
  })

  it('未踏判定：配下に食べた種がなければ untrodden=true', () => {
    expect(untrodden(tree, tree.nodes['sapindaceae'], makeLog([]))).toBe(true)
    expect(
      untrodden(
        tree,
        tree.nodes['sapindaceae'],
        makeLog([{ taxonId: 'litchi-chinensis' }]),
      ),
    ).toBe(false)
  })

  it('tried=false の記録は食べた数に数えない', () => {
    const log = makeLog([{ taxonId: 'diospyros-kaki', tried: false }])
    expect(triedSpeciesUnder(tree, tree.nodes['ebenaceae'], log)).toBe(0)
  })
})
