import { coverage, type TaxonNode } from '../core'
import { tree } from '../data/taxa'
import { useLog } from '../state/log'

/** 制覇バッジ：配下の「食べた数 / 総数」（§4.1 / §5.5）。 */
export function CoverageBadge({ node }: { node: TaxonNode }) {
  const { log } = useLog()
  const cov = coverage(tree, node, log)
  const untrodden = cov.tried === 0
  return (
    <span className={`coverage-badge ${untrodden ? 'untrodden' : ''}`}>
      {untrodden ? '未踏' : `${cov.tried}/${cov.total}`}
    </span>
  )
}
