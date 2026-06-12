import { describe, expect, it } from 'vitest'
import { buildTaxonTree } from '../tree'
import { coverage, totalSpeciesUnder, triedSpeciesUnder, untrodden } from '../coverage'
import { baseSpecies, makeLog } from './fixtures'

const tree = buildTaxonTree(baseSpecies)

describe('coverage / untrodden (§5.5 / §14)', () => {
  it('制覇率 = 食べた種数 / 総種数', () => {
    const log = makeLog([
      { taxonId: 'pouteria-caimito' },
      { taxonId: 'manilkara-zapota' },
    ])
    const cov = coverage(tree, tree.nodes['sapotaceae'], log)
    expect(cov.total).toBe(3)
    expect(cov.tried).toBe(2) // アカテツ科 2/3
    expect(cov.ratio).toBeCloseTo(2 / 3)
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
